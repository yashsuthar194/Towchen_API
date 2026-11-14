import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { DisputeService } from './dispute.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { VerifyDisputeDto } from './dto/verify-dispute.dto';
import { DisputeActionDto } from './dto/dispute-action.dto';
import { RejectDisputeDto } from './dto/reject-dispute.dto';
import { DisputeQueryDto } from './dto/dispute-query.dto';
import {
  DisputeResponseDto,
  DisputeAuditLogResponseDto,
} from './dto/dispute-response.dto';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { DisputeRoleGuard } from './guards/dispute-role.guard';
import { RequireDisputeRole } from './decorators/require-dispute-role.decorator';
import { CallerService } from 'src/services/jwt/caller.service';
import { DisputeRole, Role } from '@prisma/client';
import { ApiResponseDto } from 'src/core/response/decorators/api-response-dto.decorator';
import { ResponseDto } from 'src/core/response/dto/response.dto';

@ApiTags('Dispute Management System (DMS)')
@Controller('dispute')
@UseGuards(JwtAuthGuard, DisputeRoleGuard)
@ApiBearerAuth('JWT-auth')
export class DisputeController {
  constructor(
    private readonly disputeService: DisputeService,
    private readonly callerService: CallerService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1: CREATE DISPUTE (Vendor Flow)
  // ─────────────────────────────────────────────────────────────────────────

  @Post()
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FilesInterceptor('proof_images', 5))
  @ApiOperation({
    summary: 'Step 1: Submit a dispute request (Vendor only)',
    description:
      'Allows a vendor to raise a dispute for a **Completed** order within the 24-hour dispute window.\n\n' +
      '**Dispute Types:**\n' +
      '- `TollDispute`\n' +
      '- `KmDispute`\n' +
      '- `HydraDispute`\n' +
      '- `BorderDispute`\n' +
      '- `ExtraChargeDispute`\n' +
      '- `WaitingDispute`\n' +
      '- `FuelChargeDispute`\n\n' +
      '**Guards & Governance:**\n' +
      '- Order must have status `Completed`.\n' +
      '- Blocks creation if order closure consent has already been generated in CMS.\n' +
      '- Pauses automated CMS OrderClosure while dispute is in progress.\n' +
      '- Direct multipart file upload under `proof_images` or JSON with `proof_urls`.',
  })
  @ApiResponseDto(DisputeResponseDto, false, 201)
  async createDispute(
    @Body() dto: CreateDisputeDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ): Promise<ResponseDto<any>> {
    const caller = this.callerService.getCaller();
    const result = await this.disputeService.createDispute(dto, caller, files);
    return ResponseDto.created(
      'Dispute request submitted successfully. Pending Step 2 Resolution.',
      result,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VENDOR: My Disputes
  // ─────────────────────────────────────────────────────────────────────────

  @Get('my-disputes')
  @ApiOperation({
    summary: 'Get all dispute requests submitted by the logged-in vendor',
    description: 'Returns a paginated list of disputes created by the authenticated vendor.',
  })
  @ApiResponseDto(DisputeResponseDto, true, 200)
  async getMyDisputes(
    @Query() query: DisputeQueryDto,
  ): Promise<ResponseDto<any>> {
    const caller = this.callerService.getCaller();
    const result = await this.disputeService.findByVendor(caller.id, query);
    return ResponseDto.retrieved('Vendor disputes fetched successfully', result);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2: Dispute Resolution (Role: Resolver)
  // ─────────────────────────────────────────────────────────────────────────

  @Post(':id/resolve')
  @RequireDisputeRole(DisputeRole.Resolver)
  @ApiOperation({
    summary: 'Step 2: Resolve a dispute request (Role: Resolver)',
    description:
      'Resolves the dispute validity at Step 2 and advances it to Step 3 (`Verification`).\n\n' +
      '**Required Role:** Resolver (or SuperAdmin).',
  })
  @ApiParam({ name: 'id', description: 'Numeric ID of the dispute request', example: 1 })
  @ApiResponseDto(DisputeResponseDto, false, 200)
  async resolve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DisputeActionDto,
  ): Promise<ResponseDto<any>> {
    const caller = this.callerService.getCaller();
    const result = await this.disputeService.resolve(id, dto, caller);
    return ResponseDto.success(
      'Dispute resolved by Resolver. Advanced to Step 3 (Verification).',
      result,
    );
  }

  // Alias for Step 2
  @Post(':id/approve')
  @RequireDisputeRole(DisputeRole.Resolver)
  @ApiOperation({
    summary: 'Step 2 (Alias): Resolve dispute request (Role: Resolver)',
  })
  @ApiResponseDto(DisputeResponseDto, false, 200)
  async approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DisputeActionDto,
  ): Promise<ResponseDto<any>> {
    return this.resolve(id, dto);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3: Dispute Verification & Price Adjustment (Role: Verifier)
  // ─────────────────────────────────────────────────────────────────────────

  @Post(':id/verify')
  @RequireDisputeRole(DisputeRole.Verifier)
  @ApiOperation({
    summary: 'Step 3: Verify dispute and adjust/verify approved amount (Role: Verifier)',
    description:
      'Verifies the correctness of Step 2 Resolution, inspects proof, and **allows editing the payable price**.\n\n' +
      '**Features:**\n' +
      '- Administrator can adjust `approved_amount` (e.g. adjust down from demanded ₹500 to verified ₹350).\n' +
      '- Advances to Step 4 (`Finalization`).\n' +
      '- Enforces separation of duties (Step 2 Approver cannot verify Step 3).\n\n' +
      '**Required Role:** Verifier (or SuperAdmin).',
  })
  @ApiParam({ name: 'id', description: 'Numeric ID of the dispute request', example: 1 })
  @ApiResponseDto(DisputeResponseDto, false, 200)
  async verify(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: VerifyDisputeDto,
  ): Promise<ResponseDto<any>> {
    const caller = this.callerService.getCaller();
    const result = await this.disputeService.verify(id, dto, caller);
    return ResponseDto.success(
      'Dispute verified and price adjusted by Verifier. Advanced to Step 4 (Finalization).',
      result,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 4: Dispute Finalization (Role: Finalizer) -> Permission Granted
  // ─────────────────────────────────────────────────────────────────────────

  @Post(':id/finalize')
  @RequireDisputeRole(DisputeRole.Finalizer)
  @ApiOperation({
    summary: 'Step 4: Finalize dispute resolution (Role: Finalizer)',
    description:
      'Finalizes the dispute resolution. Sets status to `PermissionGranted` and records `finalized_at`.\n\n' +
      '**Timer Rule:** A new 24-hour countdown for Order Closure starts from `finalized_at`.\n' +
      'Enforces separation of duties (Step 3 Verifier cannot finalize Step 4).\n\n' +
      '**Required Role:** Finalizer (or SuperAdmin).',
  })
  @ApiParam({ name: 'id', description: 'Numeric ID of the dispute request', example: 1 })
  @ApiResponseDto(DisputeResponseDto, false, 200)
  async finalize(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DisputeActionDto,
  ): Promise<ResponseDto<any>> {
    const caller = this.callerService.getCaller();
    const result = await this.disputeService.finalize(id, dto, caller);
    return ResponseDto.success(
      'Dispute finalized. Permission Granted! 24-hour countdown for order closure initiated.',
      result,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REJECTION / TERMINATION FLOW
  // ─────────────────────────────────────────────────────────────────────────

  @Post(':id/reject')
  @ApiOperation({
    summary: 'Reject/terminate a dispute request',
    description:
      'Terminates a dispute at any active step (Resolution, Verification, or Finalization) with a required reason.\n\n' +
      '**Timer Rule:** When a dispute is terminated, a new 24-hour countdown starts from `terminated_at`.',
  })
  @ApiParam({ name: 'id', description: 'Numeric ID of the dispute request', example: 1 })
  @ApiResponseDto(DisputeResponseDto, false, 200)
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectDisputeDto,
  ): Promise<ResponseDto<any>> {
    const caller = this.callerService.getCaller();
    const result = await this.disputeService.reject(id, dto, caller);
    return ResponseDto.success('Dispute request terminated successfully.', result);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN READ ENDPOINTS
  // ─────────────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({
    summary: 'Get paginated list of all dispute requests (Admin)',
    description:
      'Allows administrators to query disputes with filters for status, dispute_type, order_id, vendor_id.',
  })
  @ApiResponseDto(DisputeResponseDto, true, 200)
  async findAll(@Query() query: DisputeQueryDto): Promise<ResponseDto<any>> {
    const result = await this.disputeService.findAll(query);
    return ResponseDto.retrieved('Disputes fetched successfully', result);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get dispute details by ID (including audit logs)',
    description: 'Returns the complete dispute record, audit logs, proof URLs, order, and vendor information.',
  })
  @ApiParam({ name: 'id', description: 'Numeric ID of the dispute request', example: 1 })
  @ApiResponseDto(DisputeResponseDto, false, 200)
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResponseDto<any>> {
    const result = await this.disputeService.findById(id);
    return ResponseDto.retrieved('Dispute details fetched successfully', result);
  }

  @Get(':id/audit-logs')
  @ApiOperation({
    summary: 'Get audit logs for a dispute request',
    description: 'Returns all lifecycle action logs recorded for this dispute in chronological order.',
  })
  @ApiParam({ name: 'id', description: 'Numeric ID of the dispute request', example: 1 })
  @ApiResponseDto(DisputeAuditLogResponseDto, true, 200)
  async getAuditLogs(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResponseDto<any>> {
    const logs = await this.disputeService.getAuditLogs(id);
    return ResponseDto.retrieved('Dispute audit logs fetched successfully', logs);
  }
}
