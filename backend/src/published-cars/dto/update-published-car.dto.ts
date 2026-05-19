import { PartialType } from '@nestjs/swagger';
import { CreatePublishedCarDto } from './create-published-car.dto';

export class UpdatePublishedCarDto extends PartialType(CreatePublishedCarDto) {}
