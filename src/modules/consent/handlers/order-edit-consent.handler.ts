import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  ConsentType,
  Prisma,
  consent_request,
} from '@prisma/client';
import { IConsentActionHandler } from './consent-action-handler.interface';

@Injectable()
export class OrderEditConsentHandler implements IConsentActionHandler {
  readonly consentType = ConsentType.OrderEdit;
  private readonly logger = new Logger(OrderEditConsentHandler.name);

  async execute(
    consent: consent_request,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    if (!consent.entity_id) {
      throw new BadRequestException(
        `Cannot execute OrderEdit consent without entity_id. Consent ID: ${consent.id}`,
      );
    }

    const order = await tx.order.findUnique({
      where: { id: consent.entity_id },
    });

    if (!order) {
      throw new NotFoundException(
        `Target Order #${consent.entity_id} was not found while applying approved consent.`,
      );
    }

    const payload = (consent.proposed_payload as Record<string, any>) || {};

    // Validate foreign keys if provided in payload to prevent broken relations
    if (payload.driver_id) {
      const driver = await tx.driver.findUnique({
        where: { id: payload.driver_id },
        select: { id: true, is_deleted: true },
      });
      if (!driver || driver.is_deleted) {
        throw new BadRequestException(
          `Assigned driver #${payload.driver_id} does not exist or has been deleted.`,
        );
      }
    }

    if (payload.vehicle_id) {
      const vehicle = await tx.vehicle.findUnique({
        where: { id: payload.vehicle_id },
        select: { id: true, is_deleted: true },
      });
      if (!vehicle || vehicle.is_deleted) {
        throw new BadRequestException(
          `Assigned vehicle #${payload.vehicle_id} does not exist or has been deleted.`,
        );
      }
    }

    if (payload.vendor_id) {
      const vendor = await tx.vendor.findUnique({
        where: { id: payload.vendor_id },
        select: { id: true, is_deleted: true },
      });
      if (!vendor || vendor.is_deleted) {
        throw new BadRequestException(
          `Assigned vendor #${payload.vendor_id} does not exist or has been deleted.`,
        );
      }
    }

    if (payload.service_id) {
      const service = await tx.service.findUnique({
        where: { id: payload.service_id },
        select: { id: true, is_active: true },
      });
      if (!service || !service.is_active) {
        throw new BadRequestException(
          `Service #${payload.service_id} does not exist or is inactive.`,
        );
      }
    }

    if (payload.sub_service_id) {
      const subService = await tx.sub_service.findUnique({
        where: { id: payload.sub_service_id },
        select: { id: true, is_active: true, service_id: true },
      });
      if (!subService || !subService.is_active) {
        throw new BadRequestException(
          `Sub-service #${payload.sub_service_id} does not exist or is inactive.`,
        );
      }
    }

    // Prepare update data
    const updateData: Prisma.orderUpdateInput = {};

    if (payload.status !== undefined) updateData.status = payload.status;
    if (payload.remarks !== undefined) updateData.remarks = payload.remarks;
    if (payload.cancel_reason !== undefined) updateData.cancel_reason = payload.cancel_reason;
    if (payload.discount_amount !== undefined) updateData.discount_amount = payload.discount_amount;
    if (payload.final_amount !== undefined) updateData.final_amount = payload.final_amount;
    if (payload.fleet_type !== undefined) updateData.fleet_type = payload.fleet_type;

    if (payload.driver_id !== undefined) {
      updateData.driver = payload.driver_id
        ? { connect: { id: payload.driver_id } }
        : { disconnect: true };
    }

    if (payload.vehicle_id !== undefined) {
      updateData.vehicle = payload.vehicle_id
        ? { connect: { id: payload.vehicle_id } }
        : { disconnect: true };
    }

    if (payload.vendor_id !== undefined) {
      updateData.vendor = payload.vendor_id
        ? { connect: { id: payload.vendor_id } }
        : { disconnect: true };
    }

    if (payload.service_id !== undefined) {
      updateData.service = { connect: { id: payload.service_id } };
    }

    if (payload.sub_service_id !== undefined) {
      updateData.sub_service = payload.sub_service_id
        ? { connect: { id: payload.sub_service_id } }
        : { disconnect: true };
    }

    if (payload.is_physical_vcrf_for_pickup !== undefined) {
      updateData.is_physical_vcrf_for_pickup = payload.is_physical_vcrf_for_pickup;
    }

    if (payload.is_physical_vcrf_for_dropoff !== undefined) {
      updateData.is_physical_vcrf_for_dropoff = payload.is_physical_vcrf_for_dropoff;
    }

    await tx.order.update({
      where: { id: consent.entity_id },
      data: updateData,
    });

    this.logger.log(
      `Consent #${consent.id} successfully executed: Order #${consent.entity_id} updated with fields: [${Object.keys(payload).join(', ')}]`,
    );
  }
}
