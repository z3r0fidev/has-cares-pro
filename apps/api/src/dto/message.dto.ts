import { IsString, MinLength, MaxLength } from 'class-validator';

/**
 * DTO for POST /messages/thread/:appointmentId
 *
 * Body length is capped at 2 000 characters to keep individual messages
 * reasonably sized.  PHI redaction is applied in the service layer, not
 * here, so validators only enforce structure, not content.
 */
export class SendMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;
}
