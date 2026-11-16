import {
  Injectable,
  Logger,
  Optional,
} from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { TypedConfigService } from 'src/core/config/typed-config.service';
import { ICashfreeVehicleRcResponse } from './interfaces/cashfree-rc-response.interface';

export interface VehicleRcUsageStatus {
  limit: number;
  used: number;
  remaining: number;
  reset_at: string;
  is_blocked: boolean;
  dealer_id?: number | null;
}

export interface DayRange {
  startOfDay: Date;
  endOfDay: Date;
  dateStr: string;
  resetAt: string;
}

/**
 * Calculates start and end of the current day in Indian Standard Time (IST, UTC+05:30).
 * Daily API quotas for Indian services (Cashfree VRS) reset at 00:00:00 IST.
 */
export function getIstDayRange(date = new Date()): DayRange {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(date.getTime() + IST_OFFSET_MS);

  const year = istTime.getUTCFullYear();
  const month = istTime.getUTCMonth();
  const day = istTime.getUTCDate();

  // Midnight IST in UTC
  const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0) - IST_OFFSET_MS);
  const endOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999) - IST_OFFSET_MS);
  const resetTime = new Date(Date.UTC(year, month, day + 1, 0, 0, 0, 0) - IST_OFFSET_MS);

  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const resetAt = resetTime.toISOString();

  return { startOfDay, endOfDay, dateStr, resetAt };
}

@Injectable()
export class CashfreeRateLimiterService {
  private readonly logger = new Logger(CashfreeRateLimiterService.name);

  // In-memory counter per dealer/context and daily cache
  private currentDateStr = '';
  private inMemoryCounts = new Map<string, number>();
  private readonly rcCache = new Map<string, { data: ICashfreeVehicleRcResponse; expiresAt: number }>();

  constructor(
    private readonly configService: TypedConfigService,
    @Optional() private readonly prisma?: PrismaService,
  ) {
    const range = getIstDayRange();
    this.currentDateStr = range.dateStr;
    this.logger.log(
      `Vehicle RC Rate Limiter initialized: limit=${this.dailyLimit} requests/dealer/day (resets at 00:00:00 IST)`,
    );
  }

  /**
   * Maximum vehicle RC API requests allowed per dealer per day
   */
  get dailyLimit(): number {
    return this.configService?.cashfree?.rcDailyLimit || 25;
  }

  private getDealerKey(dealerId?: number | null): string {
    return dealerId !== undefined && dealerId !== null ? `dealer_${dealerId}` : '__global__';
  }

  private getInMemoryCount(dealerId?: number | null): number {
    return this.inMemoryCounts.get(this.getDealerKey(dealerId)) || 0;
  }

  private incrementInMemoryCount(dealerId?: number | null): void {
    const key = this.getDealerKey(dealerId);
    const current = this.inMemoryCounts.get(key) || 0;
    this.inMemoryCounts.set(key, current + 1);
  }

  /**
   * Resets or aligns in-memory counters if day has changed
   */
  private checkDayRollover(): void {
    const { dateStr } = getIstDayRange();
    if (this.currentDateStr !== dateStr) {
      this.logger.log(`Day rolled over from ${this.currentDateStr} to ${dateStr}. Resetting in-memory counters.`);
      this.currentDateStr = dateStr;
      this.inMemoryCounts.clear();
      this.rcCache.clear();
    }
  }

  /**
   * Get cached vehicle RC response if available and not expired
   */
  getCachedRc(vehicleNumber: string): ICashfreeVehicleRcResponse | null {
    const key = vehicleNumber.replace(/[\s-]/g, '').toUpperCase();
    const cached = this.rcCache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiresAt) {
      this.rcCache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Cache a successful RC verification result to avoid repeat API hits
   */
  setCachedRc(vehicleNumber: string, data: ICashfreeVehicleRcResponse): void {
    const key = vehicleNumber.replace(/[\s-]/g, '').toUpperCase();
    const { endOfDay } = getIstDayRange();
    // Cache until end of today or 24h, whichever is shorter
    const expiresAt = Math.min(endOfDay.getTime(), Date.now() + 24 * 60 * 60 * 1000);
    this.rcCache.set(key, { data, expiresAt });
  }

  /**
   * Gets current usage statistics for vehicle RC requests today for a specific dealer (or overall)
   */
  async getUsageStatus(dealerId?: number | null): Promise<VehicleRcUsageStatus> {
    this.checkDayRollover();
    const { startOfDay, endOfDay, resetAt } = getIstDayRange();
    const limit = this.dailyLimit;
    const memCount = this.getInMemoryCount(dealerId);

    let dbCount = 0;
    if (this.prisma) {
      try {
        const whereClause: any = {
          created_at: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: {
            in: ['SUCCESS', 'FAILED'], // Only count actual hits to Cashfree API
          },
        };

        if (dealerId !== undefined && dealerId !== null) {
          whereClause.dealer_id = Number(dealerId);
        }

        dbCount = await this.prisma.vehicle_rc_request.count({
          where: whereClause,
        });
      } catch (error) {
        this.logger.warn(
          `Unable to query vehicle_rc_request from DB: ${error?.message || error}. Falling back to in-memory count.`,
        );
        dbCount = memCount;
      }
    } else {
      dbCount = memCount;
    }

    const used = Math.max(memCount, dbCount);
    const remaining = Math.max(0, limit - used);
    const is_blocked = used >= limit;

    return {
      limit,
      used,
      remaining,
      reset_at: resetAt,
      is_blocked,
      dealer_id: dealerId ?? null,
    };
  }

  /**
   * Checks if an RC verification request is allowed to hit Cashfree for a dealer
   */
  async checkAllowed(
    vehicleNumber: string,
    dealerId?: number | null,
  ): Promise<{
    allowed: boolean;
    cachedData?: ICashfreeVehicleRcResponse;
    usage: VehicleRcUsageStatus;
  }> {
    // 1. Check if we already have this vehicle cached today
    const cachedData = this.getCachedRc(vehicleNumber);
    if (cachedData) {
      const usage = await this.getUsageStatus(dealerId);
      return { allowed: true, cachedData, usage };
    }

    // 2. Check if the daily limit for this dealer has been reached
    const usage = await this.getUsageStatus(dealerId);
    if (usage.is_blocked) {
      return { allowed: false, usage };
    }

    return { allowed: true, usage };
  }

  /**
   * Records the outcome of an RC verification attempt
   */
  async recordHit(params: {
    vehicleNumber: string;
    dealerId?: number | null;
    verificationId?: string;
    status: 'SUCCESS' | 'FAILED' | 'BLOCKED';
    statusCode?: number;
    errorMessage?: string;
    data?: ICashfreeVehicleRcResponse;
  }): Promise<void> {
    const { vehicleNumber, dealerId, verificationId, status, statusCode, errorMessage, data } = params;
    this.checkDayRollover();

    // If actual request hit Cashfree, increment in-memory counter for this dealer
    if (status === 'SUCCESS' || status === 'FAILED') {
      this.incrementInMemoryCount(dealerId);
    }

    // Cache successful response
    if (status === 'SUCCESS' && data) {
      this.setCachedRc(vehicleNumber, data);
    }

    // Persist to database asynchronously (fire-and-forget)
    if (this.prisma) {
      try {
        await this.prisma.vehicle_rc_request.create({
          data: {
            dealer_id: dealerId ? Number(dealerId) : null,
            vehicle_number: vehicleNumber.toUpperCase().replace(/[\s-]/g, ''),
            verification_id: verificationId || null,
            status,
            status_code: statusCode || null,
            error_message: errorMessage ? String(errorMessage).substring(0, 1000) : null,
          },
        });
      } catch (err) {
        this.logger.warn(`Failed to persist vehicle_rc_request to database: ${err?.message || err}`);
      }
    }
  }

  /**
   * Helper for unit tests to reset in-memory counter and cache
   */
  _resetForTesting(customCount = 0, dealerId?: number | null): void {
    if (dealerId !== undefined && dealerId !== null) {
      this.inMemoryCounts.set(this.getDealerKey(dealerId), customCount);
    } else {
      this.inMemoryCounts.clear();
      if (customCount > 0) {
        this.inMemoryCounts.set('__global__', customCount);
      }
    }
    this.rcCache.clear();
  }
}
