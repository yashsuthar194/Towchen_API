import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { ConsentRole } from '@prisma/client';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { CallerService } from 'src/services/jwt/caller.service';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { ApiResponseDto } from 'src/core/response/decorators/api-response-dto.decorator';
import { ConsentService } from './consent.service';
import { CreateOrderEditConsentDto } from './dto/create-order-edit-consent.dto';
import { ConsentActionDto, ConsentRejectDto } from './dto/consent-action.dto';
import {
  ConsentQueryDto,
  GroupedConsentQueryDto,
} from './dto/consent-query.dto';
import {
  ConsentResponseDto,
  ConsentListResponseDto,
  ConsentAuditLogResponseDto,
  GroupedConsentResponseDto,
} from './dto/consent-response.dto';
import { ConsentRoleGuard } from './guards/consent-role.guard';
import { RequireConsentRole } from './decorators/require-consent-role.decorator';
import { AdminGuard } from 'src/services/jwt/guards/admin.guard';

@ApiTags('Consent Management')
@Controller('consent')
@UseGuards(JwtAuthGuard, ConsentRoleGuard)
@ApiBearerAuth('JWT-auth')
export class ConsentController {
  constructor(
    private readonly consentService: ConsentService,
    private readonly callerService: CallerService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1: Create Consent Request (Order Edit)
  // ─────────────────────────────────────────────────────────────────────────

  @Post('order-edit')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Step 1: Create a consent request for editing an order',
    description:
      'Creates a new consent request with status `PendingApproval` and step `Approval`.\n\n' +
      'Captures the target order snapshot and stores proposed changes in draft. ' +
      'The changes will NOT be applied to the order until permission is granted at Step 4.',
  })
  @ApiResponseDto(ConsentResponseDto, false, 201)
  async createOrderEdit(
    @Body() dto: CreateOrderEditConsentDto,
  ): Promise<ResponseDto<any>> {
    const caller = this.callerService.getCaller();
    const result = await this.consentService.createOrderEditConsent(dto, caller);
    return ResponseDto.created(
      'Order edit consent request created successfully and queued for approval.',
      result,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2: Consent Approval (Role: Approver)
  // ─────────────────────────────────────────────────────────────────────────

  @Post(':id/approve')
  @RequireConsentRole(ConsentRole.Approver)
  @ApiOperation({
    summary: 'Step 2: Approve a consent request (Role: Approver)',
    description:
      'Approves the consent at Step 2 based on its validity and advances it to Step 3 (`Verification`).\n\n' +
      '**Required Role:** Approver (or SuperAdmin). Self-approval by creator is restricted.',
  })
  @ApiParam({ name: 'id', description: 'Numeric ID of the consent request', example: 1 })
  @ApiResponseDto(ConsentResponseDto, false, 200)
  async approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConsentActionDto,
  ): Promise<ResponseDto<any>> {
    const caller = this.callerService.getCaller();
    const result = await this.consentService.approve(id, dto, caller);
    return ResponseDto.success(
      'Consent request approved by Approver. Advanced to Step 3 (Verification).',
      result,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3: Consent Verification (Role: Verifier)
  // ─────────────────────────────────────────────────────────────────────────

  @Post(':id/verify')
  @RequireConsentRole(ConsentRole.Verifier)
  @ApiOperation({
    summary: 'Step 3: Verify a consent request (Role: Verifier)',
    description:
      'Verifies the correctness of Step 2 Approval and advances to Step 4 (`Finalization`).\n\n' +
      '**Required Role:** Verifier (or SuperAdmin).',
  })
  @ApiParam({ name: 'id', description: 'Numeric ID of the consent request', example: 1 })
  @ApiResponseDto(ConsentResponseDto, false, 200)
  async verify(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConsentActionDto,
  ): Promise<ResponseDto<any>> {
    const caller = this.callerService.getCaller();
    const result = await this.consentService.verify(id, dto, caller);
    return ResponseDto.success(
      'Consent verified by Verifier. Advanced to Step 4 (Finalization).',
      result,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 4: Consent Finalization (Role: Finalizer) -> Permission Granted
  // ─────────────────────────────────────────────────────────────────────────

  @Post(':id/finalize')
  @RequireConsentRole(ConsentRole.Finalizer)
  @ApiOperation({
    summary: 'Step 4: Finalize consent request and execute changes (Role: Finalizer)',
    description:
      'Finalizes the consent request. Marks status as `PermissionGranted` and automatically ' +
      'applies the proposed field changes to the target Order in an atomic database transaction.\n\n' +
      '**Required Role:** Finalizer (or SuperAdmin).',
  })
  @ApiParam({ name: 'id', description: 'Numeric ID of the consent request', example: 1 })
  @ApiResponseDto(ConsentResponseDto, false, 200)
  async finalize(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConsentActionDto,
  ): Promise<ResponseDto<any>> {
    const caller = this.callerService.getCaller();
    const result = await this.consentService.finalize(id, dto, caller);
    return ResponseDto.success(
      'Consent finalized. Permission Granted! Proposed changes have been executed.',
      result,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REJECT ACTION (Backtracking & Termination)
  // ─────────────────────────────────────────────────────────────────────────

  @Post(':id/reject')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Reject consent request at current step (Supports backtrack routing)',
    description:
      'Rejects the consent at its current step:\n' +
      '- **At Step 2 (Approval):** Terminates the entire consent process.\n' +
      '- **At Step 3 (Verification):** Moves back to Step 2 (`Approval`) for re-approval.\n' +
      '- **At Step 4 (Finalization):** Moves back to Step 3 (`Verification`).',
  })
  @ApiParam({ name: 'id', description: 'Numeric ID of the consent request', example: 1 })
  @ApiResponseDto(ConsentResponseDto, false, 200)
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConsentRejectDto,
  ): Promise<ResponseDto<any>> {
    const caller = this.callerService.getCaller();
    const result = await this.consentService.reject(id, dto, caller);
    return ResponseDto.success(
      `Consent step rejected. Current status updated to: '${result.status}'.`,
      result,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Query Endpoints
  // ─────────────────────────────────────────────────────────────────────────

  @Get('grouped')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Get consents grouped by consent_type for an entity (CMS tab view)',
    description:
      'Returns all ongoing and past consent requests for an entity (Order, Vendor, Driver, Vehicle, Subscription, etc.) ' +
      'grouped by consent_type. Powers the expandable CMS tab list seen in Order/Entity Details.',
  })
  @ApiResponseDto(GroupedConsentResponseDto, false, 200)
  async findGrouped(@Query() query: GroupedConsentQueryDto): Promise<ResponseDto<any>> {
    const result = await this.consentService.findGroupedByEntity(
      query.entity_type,
      query.entity_id,
    );
    return ResponseDto.retrieved('Grouped consent requests fetched successfully', result);
  }

  @Get()
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Get paginated list of consent requests',
    description:
      'Returns a paginated list of consents with optional filters by status, step, and entity type.',
  })
  @ApiResponseDto(ConsentListResponseDto, false, 200)
  async findAll(@Query() query: ConsentQueryDto): Promise<ResponseDto<any>> {
    const result = await this.consentService.findAll(query);
    return ResponseDto.retrieved('Consent requests fetched successfully', result);
  }

  @Get(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Get consent request details',
    description:
      'Returns the consent request by ID including proposed changes, original snapshot diff, ' +
      'current step, and status.',
  })
  @ApiParam({ name: 'id', description: 'Numeric ID of the consent request', example: 1 })
  @ApiResponseDto(ConsentResponseDto, false, 200)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ResponseDto<any>> {
    const result = await this.consentService.findById(id);
    return ResponseDto.retrieved('Consent details fetched successfully', result);
  }

  @Get(':id/logs')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Get chronological audit logs for a consent request',
    description:
      'Returns all audit log entries for the consent request ordered by creation time, ' +
      'including actor information, action taken, step, previous/new status, and remarks/rejection reasons.',
  })
  @ApiParam({ name: 'id', description: 'Numeric ID of the consent request', example: 1 })
  @ApiResponseDto(ConsentAuditLogResponseDto, true, 200)
  async getLogs(@Param('id', ParseIntPipe) id: number): Promise<ResponseDto<any>> {
    const logs = await this.consentService.getAuditLogs(id);
    return ResponseDto.retrieved('Consent audit logs fetched successfully', logs);
  }
}
