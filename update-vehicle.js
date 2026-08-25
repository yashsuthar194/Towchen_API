const fs = require('fs');

const path = './src/modules/vehicle/vehicle.controller.ts';
let code = fs.readFileSync(path, 'utf8');

// 1. Add imports
code = code.replace(
  "import { VendorGuard } from 'src/services/jwt/guards/vendor.guard';",
  "import { VendorGuard } from 'src/services/jwt/guards/vendor.guard';\nimport { AdminOrVendorGuard } from 'src/services/jwt/guards/admin-or-vendor.guard';\nimport { AdminGuard } from 'src/services/jwt/guards/admin.guard';\nimport { CallerService } from 'src/services/jwt/caller.service';"
);

// 2. Remove VendorGuard from class
code = code.replace(
  "@UseGuards(JwtAuthGuard, VendorGuard)",
  "@UseGuards(JwtAuthGuard)"
);

// 3. Inject CallerService into constructor
code = code.replace(
  "constructor(private readonly _vehicleService: VehicleService) { }",
  "constructor(private readonly _vehicleService: VehicleService, private readonly _callerService: CallerService) { }"
);

// 4. Add @UseGuards to methods. We will use a regex to match all HTTP method decorators.
// The decorators are @Post(), @Get(), @Get(':id'), @Put(':id'), etc.
// We will add @UseGuards(VendorGuard) above them.
const httpMethods = ['@Post', '@Get', '@Put', '@Delete'];
let lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  if (httpMethods.some(method => trimmed.startsWith(method))) {
    // Determine which guard to use based on the method name
    let guard = "@UseGuards(VendorGuard)";
    
    // Look ahead to find the method name
    let j = i + 1;
    let methodName = "";
    while (j < lines.length) {
      if (lines[j].includes('async ')) {
        const match = lines[j].match(/async\s+([a-zA-Z0-9_]+)\s*\(/);
        if (match) {
          methodName = match[1];
          break;
        }
      }
      j++;
    }

    if (methodName === 'findAll' || methodName === 'findOne') {
      guard = "@UseGuards(AdminOrVendorGuard)";
    }
    
    // Insert guard before the HTTP method decorator
    lines.splice(i, 0, '  ' + guard);
    i++; // skip the newly inserted line
  }
}

// 5. Add the approve method
const approveMethod = `
  /**
   * Approve a vehicle (Admin Access)
   * @param id Vehicle ID
   */
  @UseGuards(AdminGuard)
  @Put(':id/approve')
  @ApiResponseDto(VehicleDetailDto)
  async approve(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResponseDto<VehicleDetailDto>> {
    const adminId = this._callerService.getUserId();
    const vehicle = await this._vehicleService.approveVehicleAsync(id, adminId);
    return ResponseDto.updated('Vehicle approved successfully', vehicle);
  }
`;

// Insert the approve method before the ban method
const banIndex = lines.findIndex(l => l.includes('async ban('));
if (banIndex !== -1) {
  // Go back to the comment block above ban
  let insertIndex = banIndex;
  while (insertIndex > 0 && !lines[insertIndex - 1].includes('/**')) {
    insertIndex--;
  }
  insertIndex--; // above the /**
  lines.splice(insertIndex, 0, approveMethod);
}

fs.writeFileSync(path, lines.join('\n'));
console.log('VehicleController updated successfully');
