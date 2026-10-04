import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { TableDataQueryDto } from './dto/table-data-query.dto';

export interface ColumnMetadata {
  columnName: string;
  dataType: string;
  udtName: string;
  isNullable: boolean;
  columnDefault: string | null;
  maxLength: number | null;
  isPrimaryKey: boolean;
  foreignKey?: {
    foreignTable: string;
    foreignColumn: string;
  } | null;
}

export interface TableSummary {
  name: string;
  estimatedRows: number;
  totalSize: string;
}

@Injectable()
export class DbExplorerService {
  private readonly logger = new Logger(DbExplorerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Serializes BigInt and other special types into standard JSON-serializable primitives.
   */
  private serializeRow(row: any): any {
    if (row === null || row === undefined) {
      return row;
    }
    if (typeof row === 'bigint') {
      return row <= Number.MAX_SAFE_INTEGER && row >= Number.MIN_SAFE_INTEGER
        ? Number(row)
        : row.toString();
    }
    if (Array.isArray(row)) {
      return row.map((item) => this.serializeRow(item));
    }
    if (typeof row === 'object' && !(row instanceof Date)) {
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(row)) {
        result[key] = this.serializeRow(value);
      }
      return result;
    }
    return row;
  }

  /**
   * Ensure table name contains only valid SQL identifier characters.
   */
  private sanitizeIdentifier(name: string): string {
    if (!name || !/^[a-zA-Z0-9_]+$/.test(name)) {
      throw new BadRequestException(`Invalid identifier: "${name}"`);
    }
    return name;
  }

  /**
   * List all public tables with estimated row counts and storage sizes.
   */
  async getTables(): Promise<TableSummary[]> {
    try {
      // n_live_tup is 0 for tables not yet vacuum-analyzed (common in new DBs).
      // Fallback to pg_class.reltuples which is updated on every write operation.
      const rawTables = await this.prisma.$queryRawUnsafe<any[]>(`
        SELECT 
          t.table_name as name,
          GREATEST(
            COALESCE(s.n_live_tup, 0)::bigint,
            COALESCE(c.reltuples::bigint, 0)
          ) as estimated_rows,
          COALESCE(
            pg_size_pretty(pg_total_relation_size(
              quote_ident(t.table_schema) || '.' || quote_ident(t.table_name)
            )),
            '0 kB'
          ) as total_size
        FROM information_schema.tables t
        LEFT JOIN pg_stat_user_tables s 
          ON s.relname = t.table_name AND s.schemaname = t.table_schema
        LEFT JOIN pg_class c 
          ON c.relname = t.table_name AND c.relkind = 'r'
        WHERE t.table_schema = 'public' 
          AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_name ASC;
      `);

      return rawTables.map((r) => ({
        name: r.name,
        estimatedRows: Number(r.estimated_rows ?? 0),
        totalSize: r.total_size ?? '0 kB',
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch tables: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve database tables');
    }
  }

  /**
   * Get counts for Views, Functions, and Enums in the public schema.
   * Used by the sidebar schema tree in the UI.
   */
  async getSchemaStats(): Promise<{ views: number; functions: number; enums: number }> {
    try {
      const [views, functions, enums] = await Promise.all([
        this.prisma.$queryRawUnsafe<any[]>(
          `SELECT COUNT(*)::bigint as count FROM information_schema.views WHERE table_schema = 'public'`,
        ),
        this.prisma.$queryRawUnsafe<any[]>(
          `SELECT COUNT(*)::bigint as count FROM information_schema.routines WHERE routine_schema = 'public'`,
        ),
        this.prisma.$queryRawUnsafe<any[]>(
          `SELECT COUNT(pg_type.oid)::bigint as count
           FROM pg_type
           JOIN pg_catalog.pg_namespace n ON n.oid = pg_type.typnamespace
           WHERE pg_type.typtype = 'e' AND n.nspname = 'public'`,
        ),
      ]);
      return {
        views: Number(views[0]?.count ?? 0),
        functions: Number(functions[0]?.count ?? 0),
        enums: Number(enums[0]?.count ?? 0),
      };
    } catch (error) {
      this.logger.error(`Failed to fetch schema stats: ${error.message}`, error.stack);
      return { views: 0, functions: 0, enums: 0 };
    }
  }

  /**
   * Get column metadata, primary keys, and foreign keys for a specific table.
   */
  async getTableSchema(tableName: string): Promise<ColumnMetadata[]> {
    const table = this.sanitizeIdentifier(tableName);

    try {
      // 1. Fetch column attributes and primary key indicators
      const columns = await this.prisma.$queryRawUnsafe<any[]>(
        `
        SELECT 
          c.column_name,
          c.data_type,
          c.udt_name,
          (c.is_nullable = 'YES') as is_nullable,
          c.column_default,
          c.character_maximum_length,
          (pk.column_name IS NOT NULL) as is_primary_key
        FROM information_schema.columns c
        LEFT JOIN (
          SELECT ku.column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage ku
            ON tc.constraint_name = ku.constraint_name
            AND tc.table_schema = ku.table_schema
          WHERE tc.constraint_type = 'PRIMARY KEY'
            AND tc.table_schema = 'public'
            AND tc.table_name = $1
        ) pk ON pk.column_name = c.column_name
        WHERE c.table_schema = 'public' 
          AND c.table_name = $1
        ORDER BY c.ordinal_position ASC;
        `,
        table,
      );

      if (!columns || columns.length === 0) {
        throw new NotFoundException(`Table "${table}" not found or has no columns.`);
      }

      // 2. Fetch foreign key relations
      const fks = await this.prisma.$queryRawUnsafe<any[]>(
        `
        SELECT
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
          AND tc.table_name = $1;
        `,
        table,
      );

      const fkMap = new Map<string, { foreignTable: string; foreignColumn: string }>();
      for (const fk of fks) {
        fkMap.set(fk.column_name, {
          foreignTable: fk.foreign_table_name,
          foreignColumn: fk.foreign_column_name,
        });
      }

      return columns.map((col) => ({
        columnName: col.column_name,
        dataType: col.data_type,
        udtName: col.udt_name,
        isNullable: Boolean(col.is_nullable),
        columnDefault: col.column_default,
        maxLength: col.character_maximum_length ? Number(col.character_maximum_length) : null,
        isPrimaryKey: Boolean(col.is_primary_key),
        foreignKey: fkMap.get(col.column_name) || null,
      }));
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to fetch schema for "${table}": ${error.message}`);
      throw new InternalServerErrorException(`Could not inspect schema for table ${table}`);
    }
  }

  /**
   * Fetch paginated, sortable, and searchable records from a table.
   */
  async getTableData(tableName: string, query: TableDataQueryDto) {
    const table = this.sanitizeIdentifier(tableName);
    const schema = await this.getTableSchema(table);
    const validColumnNames = schema.map((col) => col.columnName);

    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(500, Math.max(1, Number(query.limit || 50)));
    const offset = (page - 1) * limit;

    let sortCol = validColumnNames[0] || 'id';
    if (query.sortBy && validColumnNames.includes(query.sortBy)) {
      sortCol = query.sortBy;
    } else {
      const pk = schema.find((c) => c.isPrimaryKey);
      if (pk) sortCol = pk.columnName;
    }

    const sortOrder = (query.sortOrder || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Search filter across text / char / varchar / uuid columns
    const whereConditions: string[] = [];
    const params: any[] = [];

    if (query.search && query.search.trim()) {
      const searchVal = `%${query.search.trim()}%`;
      params.push(searchVal);
      const paramIndex = params.length;

      const searchableCols = schema
        .filter((c) =>
          ['text', 'character varying', 'varchar', 'char', 'uuid'].includes(c.dataType.toLowerCase()) ||
          c.dataType.toLowerCase().includes('char'),
        )
        .map((c) => `"${c.columnName}"::text ILIKE $${paramIndex}`);

      if (searchableCols.length > 0) {
        whereConditions.push(`(${searchableCols.join(' OR ')})`);
      }
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Total matching records count
    const countQuery = `SELECT count(*)::bigint as total FROM "${table}" ${whereClause};`;
    const countResult = await this.prisma.$queryRawUnsafe<any[]>(countQuery, ...params);
    const totalRows = Number(countResult[0]?.total ?? 0);

    // Fetch paginated data
    const dataQuery = `
      SELECT * 
      FROM "${table}" 
      ${whereClause} 
      ORDER BY "${sortCol}" ${sortOrder} 
      LIMIT ${limit} OFFSET ${offset};
    `;

    const rawRows = await this.prisma.$queryRawUnsafe<any[]>(dataQuery, ...params);
    const rows = rawRows.map((row) => this.serializeRow(row));

    return {
      tableName: table,
      page,
      limit,
      totalRows,
      totalPages: Math.ceil(totalRows / limit) || 1,
      columns: validColumnNames,
      rows,
    };
  }

  /**
   * Fetch single record by primary key.
   */
  async getRecordById(tableName: string, id: any, pkColumn?: string) {
    const table = this.sanitizeIdentifier(tableName);
    const schema = await this.getTableSchema(table);

    let keyCol = pkColumn;
    if (!keyCol || !schema.some((c) => c.columnName === keyCol)) {
      const pk = schema.find((c) => c.isPrimaryKey);
      keyCol = pk ? pk.columnName : 'id';
    }

    const query = `SELECT * FROM "${table}" WHERE "${keyCol}" = $1 LIMIT 1;`;
    const rows = await this.prisma.$queryRawUnsafe<any[]>(query, id);

    if (!rows || rows.length === 0) {
      throw new NotFoundException(`Record with ${keyCol}=${id} not found in ${table}`);
    }

    return this.serializeRow(rows[0]);
  }

  /**
   * Insert a new row into the specified table.
   */
  async insertRecord(tableName: string, data: Record<string, any>) {
    const table = this.sanitizeIdentifier(tableName);
    const schema = await this.getTableSchema(table);
    const validColumnNames = schema.map((c) => c.columnName);

    const keys: string[] = [];
    const values: any[] = [];
    const placeholders: string[] = [];

    for (const [key, val] of Object.entries(data)) {
      if (validColumnNames.includes(key)) {
        keys.push(`"${this.sanitizeIdentifier(key)}"`);
        values.push(val);
        placeholders.push(`$${values.length}`);
      }
    }

    if (keys.length === 0) {
      throw new BadRequestException('No valid columns provided for insertion');
    }

    const insertQuery = `
      INSERT INTO "${table}" (${keys.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *;
    `;

    try {
      const result = await this.prisma.$queryRawUnsafe<any[]>(insertQuery, ...values);
      return this.serializeRow(result[0]);
    } catch (error) {
      this.logger.error(`Insert failed on ${table}: ${error.message}`);
      throw new BadRequestException(`Database insert error: ${error.message}`);
    }
  }

  /**
   * Update an existing row by its primary key.
   */
  async updateRecord(
    tableName: string,
    id: any,
    data: Record<string, any>,
    pkColumn?: string,
  ) {
    const table = this.sanitizeIdentifier(tableName);
    const schema = await this.getTableSchema(table);
    const validColumnNames = schema.map((c) => c.columnName);

    let keyCol = pkColumn;
    if (!keyCol || !schema.some((c) => c.columnName === keyCol)) {
      const pk = schema.find((c) => c.isPrimaryKey);
      keyCol = pk ? pk.columnName : 'id';
    }

    const setClauses: string[] = [];
    const values: any[] = [];

    for (const [key, val] of Object.entries(data)) {
      // Don't update the primary key itself if present in body
      if (key !== keyCol && validColumnNames.includes(key)) {
        values.push(val);
        setClauses.push(`"${this.sanitizeIdentifier(key)}" = $${values.length}`);
      }
    }

    if (setClauses.length === 0) {
      throw new BadRequestException('No valid columns provided for update');
    }

    // Add primary key value at the end of parameters
    values.push(id);
    const pkParamIndex = values.length;

    const updateQuery = `
      UPDATE "${table}"
      SET ${setClauses.join(', ')}
      WHERE "${keyCol}" = $${pkParamIndex}
      RETURNING *;
    `;

    try {
      const result = await this.prisma.$queryRawUnsafe<any[]>(updateQuery, ...values);
      if (!result || result.length === 0) {
        throw new NotFoundException(`Record with ${keyCol}=${id} not found in ${table}`);
      }
      return this.serializeRow(result[0]);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Update failed on ${table}: ${error.message}`);
      throw new BadRequestException(`Database update error: ${error.message}`);
    }
  }

  /**
   * Delete a record by its primary key.
   */
  async deleteRecord(tableName: string, id: any, pkColumn?: string) {
    const table = this.sanitizeIdentifier(tableName);
    const schema = await this.getTableSchema(table);

    let keyCol = pkColumn;
    if (!keyCol || !schema.some((c) => c.columnName === keyCol)) {
      const pk = schema.find((c) => c.isPrimaryKey);
      keyCol = pk ? pk.columnName : 'id';
    }

    const deleteQuery = `DELETE FROM "${table}" WHERE "${keyCol}" = $1 RETURNING "${keyCol}";`;

    try {
      const result = await this.prisma.$queryRawUnsafe<any[]>(deleteQuery, id);
      if (!result || result.length === 0) {
        throw new NotFoundException(`Record with ${keyCol}=${id} not found in ${table}`);
      }
      return { success: true, deletedId: id };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Delete failed on ${table}: ${error.message}`);
      throw new BadRequestException(`Database delete error: ${error.message}`);
    }
  }

  /**
   * Execute an arbitrary SQL query and return execution metrics and tabular result.
   */
  async executeQuery(rawQuery: string) {
    const query = rawQuery?.trim();
    if (!query) {
      throw new BadRequestException('SQL query cannot be empty');
    }

    const start = performance.now();
    try {
      const rawResult = await this.prisma.$queryRawUnsafe<any[]>(query);
      const executionTimeMs = parseFloat((performance.now() - start).toFixed(2));

      // Handle queries that return rows vs empty results
      if (!Array.isArray(rawResult)) {
        return {
          success: true,
          executionTimeMs,
          rowCount: 0,
          columns: [],
          rows: [],
          message: 'Query executed successfully with no rows returned.',
        };
      }

      const rows = rawResult.map((row) => this.serializeRow(row));
      const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

      return {
        success: true,
        executionTimeMs,
        rowCount: rows.length,
        columns,
        rows,
      };
    } catch (error) {
      const executionTimeMs = parseFloat((performance.now() - start).toFixed(2));
      this.logger.error(`Query execution error: ${error.message}`);
      return {
        success: false,
        executionTimeMs,
        error: error.message || 'Error executing query',
      };
    }
  }
}
