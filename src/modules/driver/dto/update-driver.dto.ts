import { PartialType } from '@nestjs/swagger';
import { CreateDriverDto } from './create-driver.dto';

export class UpdateDriverDto extends PartialType(CreateDriverDto) {
  /**
   * Extracts driver-only data
   */
  static toDriverData(dto: UpdateDriverDto) {
    return { ...dto };
  }
}
