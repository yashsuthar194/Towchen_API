import { ApiProperty } from '@nestjs/swagger';

export class VehicleUploadFilesPostDto {
    @ApiProperty({
        type: 'string',
        format: 'binary',
        description: 'Vehical Images (Max 4)',
        isArray: true,
        required: false,
    })
    vehical_image: Express.Multer.File[];

    @ApiProperty({
        type: 'string',
        format: 'binary',
        description: 'Chassis Images (Max 4)',
        isArray: true,
        required: false,
    })
    chassis_image: Express.Multer.File[];

    @ApiProperty({
        type: 'string',
        format: 'binary',
        description: 'Tax Images (Max 4)',
        isArray: true,
        required: false,
    })
    tax_image: Express.Multer.File[];

    @ApiProperty({
        type: 'string',
        format: 'binary',
        description: 'Insurance Images (Max 4)',
        isArray: true,
        required: false,
    })
    insurance_image: Express.Multer.File[];

    @ApiProperty({
        type: 'string',
        format: 'binary',
        description: 'Fitness Images (Max 4)',
        isArray: true,
        required: false,
    })
    fitness_image: Express.Multer.File[];

    @ApiProperty({
        type: 'string',
        format: 'binary',
        description: 'PUC Images (Max 4)',
        isArray: true,
        required: false,
    })
    puc_image: Express.Multer.File[];
}
