import { Controller, Get, Post, Body, Put, Param, Delete, ParseIntPipe, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { DriverService } from './driver.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { DriverUploadFilesPostDto } from './dto/driver-upload-files.post.dto';

@ApiExtraModels(DriverUploadFilesPostDto, CreateDriverDto, UpdateDriverDto)
@Controller('driver')
export class DriverController {
    constructor(private readonly driverService: DriverService) { }

    @Post()
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            allOf: [
                { $ref: getSchemaPath(CreateDriverDto) },
                { $ref: getSchemaPath(DriverUploadFilesPostDto) },
            ],
        },
    })
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'adhar_card', maxCount: 1 },
            { name: 'pan_card', maxCount: 1 },
            { name: 'driver_license', maxCount: 1 },
        ]),
    )
    create(
        @Body() createDriverDto: CreateDriverDto,
        @UploadedFiles() files: DriverUploadFilesPostDto,
    ) {
        return this.driverService.create(createDriverDto, files);
    }

    @Get()
    findAll() {
        return this.driverService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.driverService.findOne(id);
    }

    @Put(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() updateDriverDto: UpdateDriverDto) {
        return this.driverService.update(id, updateDriverDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.driverService.remove(id);
    }
}
