import { Module } from '@nestjs/common';
import { DateService } from './helper/date.service';

@Module({
  providers: [DateService],
  exports: [DateService],
})
export class SharedModule {}
