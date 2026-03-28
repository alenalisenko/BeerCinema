import { InputType, PartialType } from '@nestjs/graphql';
import { CreateSessionInput } from './create-session.input';

@InputType()
export class UpdateSessionInput extends PartialType(CreateSessionInput) {}
