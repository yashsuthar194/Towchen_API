import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { NoLog } from '../log/decorators/no-log.decorator';
import { DbExplorerService } from './db-explorer.service';
import { QueryRunnerDto } from './dto/query-runner.dto';
import { TableDataQueryDto } from './dto/table-data-query.dto';

@ApiTags('Database Explorer')
@NoLog()
@Controller('db-explorer/api')
export class DbExplorerController {
  constructor(private readonly dbExplorerService: DbExplorerService) {}

  @ApiOperation({ summary: 'Get schema stats: view, function, and enum counts for the sidebar tree' })
  @Get('schema-stats')
  async getSchemaStats() {
    const stats = await this.dbExplorerService.getSchemaStats();
    return ResponseDto.success('Schema stats retrieved successfully', stats);
  }

  @ApiOperation({ summary: 'List all database tables with stats and sizes' })
  @Get('tables')
  async getTables() {
    const tables = await this.dbExplorerService.getTables();
    return ResponseDto.success('Tables retrieved successfully', tables);
  }

  @ApiOperation({ summary: 'Get column schema metadata for a table' })
  @ApiParam({ name: 'table', description: 'Table name', example: 'vendor' })
  @Get('tables/:table/schema')
  async getTableSchema(@Param('table') table: string) {
    const schema = await this.dbExplorerService.getTableSchema(table);
    return ResponseDto.success(`Schema for ${table} retrieved successfully`, schema);
  }

  @ApiOperation({ summary: 'Fetch paginated, searchable, sortable rows from a table' })
  @ApiParam({ name: 'table', description: 'Table name', example: 'vendor' })
  @Get('tables/:table/data')
  async getTableData(
    @Param('table') table: string,
    @Query() query: TableDataQueryDto,
  ) {
    const data = await this.dbExplorerService.getTableData(table, query);
    return ResponseDto.success(`Data for ${table} retrieved successfully`, data);
  }

  @ApiOperation({ summary: 'Get a single record by primary key' })
  @ApiParam({ name: 'table', description: 'Table name', example: 'vendor' })
  @ApiParam({ name: 'id', description: 'Record ID' })
  @ApiQuery({ name: 'pkColumn', required: false, description: 'Primary key column name (defaults to id)' })
  @Get('tables/:table/data/:id')
  async getRecordById(
    @Param('table') table: string,
    @Param('id') id: string,
    @Query('pkColumn') pkColumn?: string,
  ) {
    const record = await this.dbExplorerService.getRecordById(table, id, pkColumn);
    return ResponseDto.success(`Record retrieved successfully`, record);
  }

  @ApiOperation({ summary: 'Insert a new record into a table' })
  @ApiParam({ name: 'table', description: 'Table name', example: 'vendor' })
  @Post('tables/:table/data')
  async insertRecord(
    @Param('table') table: string,
    @Body() body: Record<string, any>,
  ) {
    const record = await this.dbExplorerService.insertRecord(table, body);
    return ResponseDto.success(`Record created successfully in ${table}`, record, 201);
  }

  @ApiOperation({ summary: 'Update an existing record by primary key' })
  @ApiParam({ name: 'table', description: 'Table name', example: 'vendor' })
  @ApiParam({ name: 'id', description: 'Record ID' })
  @ApiQuery({ name: 'pkColumn', required: false, description: 'Primary key column name (defaults to id)' })
  @Put('tables/:table/data/:id')
  async updateRecord(
    @Param('table') table: string,
    @Param('id') id: string,
    @Body() body: Record<string, any>,
    @Query('pkColumn') pkColumn?: string,
  ) {
    const record = await this.dbExplorerService.updateRecord(table, id, body, pkColumn);
    return ResponseDto.success(`Record ${id} in ${table} updated successfully`, record);
  }

  @ApiOperation({ summary: 'Delete a record by primary key' })
  @ApiParam({ name: 'table', description: 'Table name', example: 'vendor' })
  @ApiParam({ name: 'id', description: 'Record ID' })
  @ApiQuery({ name: 'pkColumn', required: false, description: 'Primary key column name (defaults to id)' })
  @Delete('tables/:table/data/:id')
  async deleteRecord(
    @Param('table') table: string,
    @Param('id') id: string,
    @Query('pkColumn') pkColumn?: string,
  ) {
    const result = await this.dbExplorerService.deleteRecord(table, id, pkColumn);
    return ResponseDto.success(`Record ${id} deleted successfully from ${table}`, result);
  }

  @ApiOperation({ summary: 'Execute raw SQL query and return columns and rows' })
  @Post('query')
  async executeQuery(@Body() body: QueryRunnerDto) {
    const result = await this.dbExplorerService.executeQuery(body.query);
    return ResponseDto.success('Query executed', result);
  }
}
