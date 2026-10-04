# Towchen Project - Coding Standards & Agent Guidelines

> This file is auto-discovered by the Antigravity AI agent on every task in this workspace.
> It defines the mandatory coding conventions, architecture decisions, and patterns used across
> the Towchen monorepo (NestJS API + Angular DB Explorer UI).

---

## Project Structure

```
f:\FreeLance\
  towchen_api/              # NestJS 11 backend (primary workspace)
    src/
      app.module.ts
      main.ts
      core/             # Global config, response, prisma, guards
      modules/          # Feature modules (one folder per domain)
      services/         # Shared infrastructure services (JWT, etc.)
      shared/           # Shared utilities and interceptors
    prisma/schema.prisma
    docs/               # Specs and walkthroughs
    GEMINI.md           # <-- THIS FILE (auto-discovered)
  towchen_db_explorer_ui/   # Angular 22 standalone frontend (DB Explorer)
    src/
      app/
      styles.scss
    angular.json
    proxy.conf.json
```

---

## NestJS Backend Standards

### Module Structure
Every feature module MUST follow this exact structure:
```
src/modules/<domain>/
  <domain>.module.ts
  <domain>.controller.ts
  <domain>.service.ts
  dto/
    create-<domain>.dto.ts
    update-<domain>.dto.ts
    <domain>.dto.ts
```

### Response Wrapping
ALL controller endpoints MUST return using `ResponseDto.success(...)`:
```typescript
return ResponseDto.success('Human-readable message', data);
return ResponseDto.success('Record created successfully', record, 201);
```
Never return raw data directly from a controller.

### DTOs
- Use `class-validator` decorators for all validation.
- Use `@ApiProperty` / `@ApiPropertyOptional` from `@nestjs/swagger` on every field.
- Use `@Type(() => Number)` from `class-transformer` for numeric query params.
- Use `whitelist: true` (already configured globally in `main.ts`).

```typescript
export class CreateVendorDto {
  @ApiProperty({ description: 'Vendor email', example: 'vendor@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;
}
```

### Error Handling
Use NestJS built-in HTTP exceptions only -- never throw generic `Error`:
```typescript
throw new NotFoundException(`Record with id=${id} not found`);
throw new BadRequestException('Invalid input: reason');
throw new InternalServerErrorException('Something went wrong');
```

Always log errors using the injected `Logger`:
```typescript
private readonly logger = new Logger(MyService.name);
// ...
this.logger.error(`Failed: ${error.message}`, error.stack);
```

### Prisma Patterns
- `PrismaService` is `@Global()` -- do NOT import `PrismaModule` in feature modules.
- Use `prisma.$queryRawUnsafe()` ONLY for introspection / dynamic queries.
- For normal CRUD, use typed Prisma client methods.
- Always sanitize dynamic identifiers before raw SQL.

### Controller Decorators
Every controller MUST have:
```typescript
@ApiTags('Tag Name')
@Controller('route-prefix')
export class MyController { ... }
```
Use `@ApiBearerAuth('JWT-auth')` for protected routes.

### Naming Conventions
- Files: kebab-case (e.g., `vendor-bank-detail.service.ts`)
- Classes: PascalCase
- Variables and functions: camelCase
- DB columns: snake_case (Prisma maps these automatically)
- No default exports -- always use named exports

---

## Angular 22 Frontend Standards (DB Explorer UI)

### Core Setup
- Angular 22 (latest stable)
- Zoneless change detection: `provideExperimentalZonelessChangeDetection()`
- No NgModules -- all components are standalone
- No zone.js -- do NOT import it

### State Management -- Signals Only
```typescript
readonly tables = signal<TableSummary[]>([]);
readonly selectedTable = signal<string | null>(null);
readonly isLoading = signal(false);
readonly filteredTables = computed(() =>
  this.tables().filter(t => t.name.includes(this.searchQuery()))
);
```
No `BehaviorSubject` for UI state. Use `effect()` for side effects.

### Dependency Injection
Use `inject()` function -- NOT constructor injection:
```typescript
export class TableListComponent {
  private readonly apiService = inject(DbExplorerApiService);
  private readonly router = inject(Router);
}
```

### Component Structure
```typescript
@Component({
  selector: 'app-table-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './table-list.component.html',
  styleUrl: './table-list.component.scss',
})
export class TableListComponent { ... }
```

### HTTP and Services
Use async/await with `firstValueFrom`:
```typescript
async loadTables(): Promise<void> {
  this.isLoading.set(true);
  try {
    const result = await firstValueFrom(
      this.http.get<ApiResponse<TableSummary[]>>('/db-explorer/api/tables')
    );
    this.tables.set(result.data);
  } finally {
    this.isLoading.set(false);
  }
}
```

### Routing
Use lazy-loaded routes with `loadComponent`:
```typescript
export const routes: Routes = [
  {
    path: 'tables/:name',
    loadComponent: () =>
      import('./table-view/table-view.component').then(m => m.TableViewComponent),
  },
];
```

### Styling
- Dark theme with CSS custom properties (design tokens in `styles.scss`)
- No Tailwind -- plain SCSS with BEM-like naming
- Use `@layer` for cascade management
- Define all colors, spacing, typography as CSS variables

---

## TypeScript Standards

- `strict: true` in `tsconfig.json` -- always
- Prefer `interface` over `type` for object shapes
- Use `readonly` for signals and injected dependencies
- Avoid `any` -- use `unknown` and narrow types
- Use optional chaining `?.` and nullish coalescing `??`

---

## API Communication (Angular <-> NestJS)

- NestJS API: `http://localhost:3000`
- Angular UI: `http://localhost:4200`
- CORS is enabled globally in `main.ts` (`app.enableCors()`)
- Dev proxy configured in `proxy.conf.json` to forward `/db-explorer/api` to port 3000

All API responses follow this shape:
```json
{ "success": true, "statusCode": 200, "message": "...", "data": {} }
```
Always type the `data` field -- never use `any`.

---

## Key Libraries and Versions

| Package | Version | Notes |
|---|---|---|
| @nestjs/core | ^11.0.1 | Backend framework |
| @prisma/client | ^7.3.0 | ORM |
| @angular/core | ^22.x | Frontend framework |
| class-validator | ^0.14.3 | DTO validation |
| class-transformer | ^0.5.1 | DTO transformation |
| @nestjs/swagger | ^11.2.6 | API docs |

---

## What NOT to Do

- Do NOT use NgZone or zone.js in Angular -- project is zoneless
- Do NOT use NgModule -- all Angular components must be standalone
- Do NOT use subscribe() for one-shot HTTP calls -- use firstValueFrom()
- Do NOT skip ResponseDto.success() wrapper in NestJS controllers
- Do NOT use prisma.$queryRawUnsafe for normal CRUD -- only for introspection
- Do NOT hardcode env values -- use TypedConfigService (backend) or environment files (frontend)
- Do NOT use default exports in TypeScript files