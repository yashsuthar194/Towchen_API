import { PartialType } from '@nestjs/swagger';
import { CreateDealerPackagePlanDto } from './create-dealer-package-plan.dto';

export class UpdateDealerPackagePlanDto extends PartialType(CreateDealerPackagePlanDto) {}
