import { ApiPropertyOptional } from '@nestjs/swagger';

export class VehicleUploadFilesPutDto {
    @ApiPropertyOptional({ type: 'string', format: 'binary' })
    vehical_image?: Express.Multer.File[];

    @ApiPropertyOptional({ type: 'string', format: 'binary' })
    chassis_image?: Express.Multer.File[];

    @ApiPropertyOptional({ type: 'string', format: 'binary' })
    tax_image?: Express.Multer.File[];

    @ApiPropertyOptional({ type: 'string', format: 'binary' })
    insurance_image?: Express.Multer.File[];

    @ApiPropertyOptional({ type: 'string', format: 'binary' })
    fitness_image?: Express.Multer.File[];

    @ApiPropertyOptional({ type: 'string', format: 'binary' })
    puc_image?: Express.Multer.File[];
}
