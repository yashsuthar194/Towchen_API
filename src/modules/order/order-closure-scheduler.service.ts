import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/core/prisma/prisma.service';
import {
  OrderStatus,
  DisputeStatus,
  ConsentEntityType,
  ConsentType,
  ConsentStatus,
  ConsentStep,
  ConsentAction,
  ConsentRole,
  Role,
} from '@prisma/client';

@Injectable()
export class OrderClosureSchedulerService {
  private readonly logger = new Logger(OrderClosureSchedulerService.name);
  private isProcessing = false;

  // 24 hours in milliseconds (configurable via environment variable)
  private readonly CLOSURE_WINDOW_MS =
    process.env.ORDER_CLOSURE_WINDOW_MS
      ? parseInt(process.env.ORDER_CLOSURE_WINDOW_MS, 10)
      : 24 * 60 * 60 * 1000;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cron job that executes every 5 minutes to identify Completed orders
   * that have passed their 24-hour dispute window and automatically
   * generates a CMS OrderClosure consent request.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleOrderClosureCron(): Promise<void> {
    if (this.isProcessing) {
      this.logger.debug('Order closure cron is already in progress, skipping tick.');
      return;
    }

    this.isProcessing = true;
    try {
      await this.processCompletedOrdersForClosure();
    } catch (error) {
      this.logger.error('Error during Order Closure scheduler execution:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Public execution method allowing manual invocation or automated cron runs.
   */
  async processCompletedOrdersForClosure(): Promise<number> {
    const now = Date.now();

    // 1. Fetch orders in Completed status
    const completedOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.Completed,
      },
      include: {
        disputes: {
          select: {
            id: true,
            status: true,
            demanded_amount: true,
            approved_amount: true,
            finalized_at: true,
            terminated_at: true,
            updated_at: true,
          },
        },
      },
      orderBy: { completion_time: 'asc' },
    });

    if (completedOrders.length === 0) {
      return 0;
    }

    let closedConsentCount = 0;

    for (const order of completedOrders) {
      try {
        // 2. Check if a CMS OrderClosure request already exists
        const existingClosureConsent = await this.prisma.consent_request.findFirst({
          where: {
            entity_type: ConsentEntityType.Order,
            entity_id: order.id,
            consent_type: ConsentType.OrderClosure,
          },
          select: { id: true, status: true },
        });

        if (existingClosureConsent) {
          // Closure request already created or completed
          continue;
        }

        // 3. Evaluate disputes for this order
        const activeStatuses: DisputeStatus[] = [
          DisputeStatus.PendingResolution,
          DisputeStatus.PendingVerification,
          DisputeStatus.PendingFinalization,
        ];
        const activeDisputes = order.disputes.filter((d) =>
          activeStatuses.includes(d.status),
        );

        if (activeDisputes.length > 0) {
          // As long as any dispute is active/unresolved, CMS cannot be generated
          this.logger.debug(
            `Order #${order.id} (${order.formated_id}) has ${activeDisputes.length} active dispute(s). CMS auto-creation is halted.`,
          );
          continue;
        }

        // 4. Calculate base timestamp for the 24-hour window
        let baseTimestamp: number;

        if (order.disputes.length > 0) {
          // If disputes exist (all are finalized/terminated), base time is the latest resolution timestamp
          const resolutionTimes = order.disputes.map((d) => {
            const time = d.finalized_at || d.terminated_at || d.updated_at;
            return time.getTime();
          });
          baseTimestamp = Math.max(...resolutionTimes);
        } else {
          // No disputes ever raised: base time is the order completion_time (or updated_at fallback)
          baseTimestamp = (order.completion_time ?? order.updated_at).getTime();
        }

        const elapsedMs = now - baseTimestamp;
        if (elapsedMs < this.CLOSURE_WINDOW_MS) {
          // Vendor is still within the 24-hour window
          continue;
        }

        // 5. 24 hours have elapsed! Generate CMS OrderClosure request atomically
        const totalApprovedDisputes = order.disputes
          .filter((d) => d.status === DisputeStatus.PermissionGranted)
          .reduce((sum, d) => sum + (d.approved_amount ?? 0), 0);

        const totalDemandedDisputes = order.disputes.reduce(
          (sum, d) => sum + (d.demanded_amount ?? 0),
          0,
        );

        await this.prisma.$transaction(async (tx) => {
          // Concurrency check inside transaction
          const doubleCheck = await tx.consent_request.findFirst({
            where: {
              entity_type: ConsentEntityType.Order,
              entity_id: order.id,
              consent_type: ConsentType.OrderClosure,
            },
            select: { id: true },
          });

          if (doubleCheck) {
            return;
          }

          // Dynamically resolve an active SuperAdmin or Admin ID for the system audit trail
          let adminId = 1;
          let adminRole: Role = Role.Admin;
          try {
            const systemAdmin = await tx.admin?.findFirst?.({
              where: { is_deleted: false },
              orderBy: { id: 'asc' },
              select: { id: true, role: true },
            });
            if (systemAdmin) {
              adminId = systemAdmin.id;
              adminRole = systemAdmin.role;
            }
          } catch {
            // Safe fallback to defaults
          }

          const consentRequest = await tx.consent_request.create({
            data: {
              entity_type: ConsentEntityType.Order,
              entity_id: order.id,
              consent_type: ConsentType.OrderClosure,
              title: `Order Closure: ${order.formated_id || '#' + order.id}`,
              description:
                'Automated Order Closure initiated after 24-hour dispute window elapsed without pending disputes.',
              proposed_payload: {
                status: OrderStatus.Closed,
                order_id: order.id,
                closure_trigger: 'AutomatedAfter24Hours',
                completion_time: order.completion_time ?? order.updated_at,
                total_approved_dispute_amount: totalApprovedDisputes,
                total_demanded_dispute_amount: totalDemandedDisputes,
                dispute_count: order.disputes.length,
              },
              original_payload: {
                status: order.status,
                order_id: order.id,
              },
              status: ConsentStatus.PendingApproval,
              current_step: ConsentStep.Approval,
              created_by_id: adminId,
              created_by_role: adminRole,
            },
          });

          await tx.consent_audit_log.create({
            data: {
              consent_request_id: consentRequest.id,
              step: ConsentStep.Approval,
              action: ConsentAction.Submit,
              previous_status: ConsentStatus.PendingApproval,
              new_status: ConsentStatus.PendingApproval,
              performed_by_id: adminId,
              performed_by_role: 'System',
              actor_consent_role: ConsentRole.Approver,
              remarks:
                '24-hour dispute window elapsed. Automated Order Closure consent request created in CMS.',
              metadata: {
                order_id: order.id,
                order_formated_id: order.formated_id,
                total_approved_dispute_amount: totalApprovedDisputes,
                dispute_count: order.disputes.length,
              },
            },
          });

          closedConsentCount++;
          this.logger.log(
            `[OrderClosureScheduler] Automated CMS OrderClosure consent #${consentRequest.id} generated for Order #${order.id} (${order.formated_id}). Dispute window is now closed.`,
          );
        });
      } catch (orderError) {
        this.logger.error(
          `Failed to process Order Closure for Order #${order.id}:`,
          orderError,
        );
      }
    }

    return closedConsentCount;
  }
}
