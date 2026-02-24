# SMS Service - Strategy Pattern Implementation

## Overview

The SMS service has been refactored using the **Strategy Pattern** to provide a flexible, extensible, and maintainable SMS messaging solution. This implementation allows easy switching between different SMS providers without changing client code.

## Architecture

### Directory Structure

```
src/services/sms/
├── sms.service.ts              # Main facade service (Context)
├── sms.module.ts               # Module with factory provider
├── interfaces/
│   └── sms.interface.ts        # Strategy interface
├── providers/
│   ├── twilio-sms.service.ts   # Twilio implementation
│   ├── aws-sns.service.ts      # (Future) AWS SNS provider
│   └── vonage.service.ts       # (Future) Vonage/Nexmo provider
└── types/
    ├── send-sms.dto.ts         # Input DTO
    ├── sms-response.dto.ts     # Response DTO
    └── twilio-config.ts        # Provider-specific config
```

### Configuration

Configuration is managed through the `SmsConfig` class in:
```
src/core/config/namespaces/sms.config.ts
```

## Environment Variables

### Required Variables (for Twilio)

```env
SMS_PROVIDER=twilio            # Optional, defaults to 'twilio'
TWILIO_ACCOUNT_SID=ACxxxx     # Twilio Account SID
TWILIO_AUTH_TOKEN=your-token   # Twilio Auth Token
TWILIO_PHONE_NUMBER=+1234567890 # Your Twilio phone number
```

### Supported Providers

- `twilio` - Twilio SMS/MMS (default)
- `aws-sns` - (Future) AWS Simple Notification Service
- `vonage` - (Future) Vonage/Nexmo
- `messagebird` - (Future) MessageBird

## Usage

### Basic Usage

```typescript
import { SmsService } from 'src/services/sms/sms.service';

@Injectable()
export class OtpService {
  constructor(private readonly smsService: SmsService) {}

  async sendVerificationSms(phoneNumber: string, code: string) {
    const result = await this.smsService.sendSmsAsync({
      to: phoneNumber,
      message: `Your verification code is: ${code}`,
    });

    if (result.success) {
      console.log(`SMS sent with ID: ${result.messageId}, Status: ${result.status}`);
    } else {
      console.error(`Failed to send SMS: ${result.errorMessage}`);
    }
  }
}
```

### Advanced Usage with Custom From Number

```typescript
await this.smsService.sendSmsAsync({
  to: '+1234567890',
  from: '+0987654321', // Optional override
  message: 'Your order has been shipped!',
});
```

### Sending MMS with Media

```typescript
await this.smsService.sendSmsAsync({
  to: '+1234567890',
  message: 'Check out this image!',
  mediaUrl: 'https://example.com/image.jpg', // Twilio supports MMS
});
```

### Bulk SMS

```typescript
const results = await this.smsService.sendBulkSmsAsync([
  { to: '+1234567890', message: 'Hello User 1' },
  { to: '+0987654321', message: 'Hello User 2' },
  { to: '+1122334455', message: 'Hello User 3' },
]);

results.forEach((result) => {
  if (result.success) {
    console.log(`Sent to ${result.recipient}: ${result.messageId}`);
  } else {
    console.error(`Failed to send to ${result.recipient}: ${result.errorMessage}`);
  }
});
```

### Check Message Status

```typescript
try {
  const status = await this.smsService.getMessageStatusAsync('SM123456789');
  console.log(`Message status: ${status.status}`);
  
  if (status.status === 'failed') {
    console.error(`Error: ${status.errorMessage}`);
  }
} catch (error) {
  console.error('Status tracking not supported by provider');
}
```

### Verify Connection

```typescript
try {
  const isValid = await this.smsService.verifyConnectionAsync();
  console.log('SMS service is configured correctly');
} catch (error) {
  console.error('SMS service configuration error:', error);
}
```

### Legacy Compatibility

The old `sendSms` method is still supported for backward compatibility:

```typescript
// Old method (deprecated)
await this.smsService.sendSms('+1234567890', 'Your OTP is 123456');

// New method (recommended)
await this.smsService.sendSmsAsync({
  to: '+1234567890',
  message: 'Your OTP is 123456',
});
```

## Response Structure

The `sendSmsAsync` method returns a structured response:

```typescript
{
  messageId: 'SM123456789',           // Provider's message ID
  success: true,                      // Whether send was successful
  recipient: '+1234567890',           // Recipient phone number
  status: 'queued',                   // Current delivery status
  metadata: {                         // Provider-specific data
    accountSid: 'ACxxxx',
    numSegments: '1',
    price: '-0.0075',
    priceUnit: 'USD'
  },
  errorMessage?: 'Optional error'    // If failed
}
```

### Status Values

- `queued` - Message accepted and queued for delivery
- `sent` - Message dispatched to carrier
- `delivered` - Message delivered to recipient
- `failed` - Permanent delivery failure
- `undelivered` - Temporary delivery failure

## Adding a New Provider

To add a new SMS provider (e.g., AWS SNS):

### 1. Create the Provider Class

```typescript
// src/services/sms/providers/aws-sns.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { ISmsService } from '../interfaces/sms.interface';
import { SendSmsDto } from '../types/send-sms.dto';
import { SmsResponseDto } from '../types/sms-response.dto';
import { TypedConfigService } from 'src/core/config/typed-config.service';

@Injectable()
export class AwsSnsService implements ISmsService {
  private readonly logger = new Logger(AwsSnsService.name);
  private readonly snsClient: SNSClient;

  constructor(private readonly configService: TypedConfigService) {
    // Initialize AWS SNS client
    this.snsClient = new SNSClient({
      region: this.configService.sms.AWS_SNS_REGION,
      credentials: {
        accessKeyId: this.configService.sms.AWS_SNS_ACCESS_KEY_ID!,
        secretAccessKey: this.configService.sms.AWS_SNS_SECRET_ACCESS_KEY!,
      },
    });
  }

  async sendSmsAsync(sendSmsDto: SendSmsDto): Promise<SmsResponseDto> {
    try {
      const command = new PublishCommand({
        Message: sendSmsDto.message,
        PhoneNumber: sendSmsDto.to,
      });

      const response = await this.snsClient.send(command);

      return {
        messageId: response.MessageId!,
        success: true,
        recipient: sendSmsDto.to,
        status: 'sent',
      };
    } catch (error) {
      return {
        messageId: '',
        success: false,
        recipient: sendSmsDto.to,
        status: 'failed',
        errorMessage: error.message,
      };
    }
  }

  async verifyConnectionAsync(): Promise<boolean> {
    // Implement verification logic
    return true;
  }
}
```

### 2. Update Configuration

Add new provider config fields to `SmsConfig` if needed.

### 3. Register in Module

```typescript
// src/services/sms/sms.module.ts
{
  provide: 'SMS_PROVIDER',
  useFactory: (config: TypedConfigService) => {
    const provider = config.sms.SMS_PROVIDER;
    
    switch (provider) {
      case SmsProvider.Twilio:
        return new TwilioSmsService(config);
      case SmsProvider.AWSSNS:
        return new AwsSnsService(config); // Add case
      default:
        return new TwilioSmsService(config);
    }
  },
  inject: [TypedConfigService],
}
```

### 4. Add Environment Variables

```env
SMS_PROVIDER=aws-sns
AWS_SNS_REGION=us-east-1
AWS_SNS_ACCESS_KEY_ID=your-key
AWS_SNS_SECRET_ACCESS_KEY=your-secret
```

## Benefits

1. **Provider Agnostic**: Switch between Twilio, AWS SNS, Vonage via configuration
2. **Rich Responses**: Structured response with messageId, status, and metadata
3. **Advanced Features**: Bulk sending, status tracking, MMS support
4. **Type Safety**: Full TypeScript support with validated DTOs
5. **Testability**: Easy to mock `ISmsService` interface
6. **Backward Compatible**: Legacy `sendSms()` method maintained
7. **Error Resilience**: Better error handling with success/failure tracking
8. **Configuration Isolation**: Dedicated SMS config namespace

## Migration Guide

If you're upgrading from the old Twilio implementation:

### 1. Update Module Imports

```typescript
// Before
import { TwilioService } from 'src/services/twilio/twilio.service';
providers: [TwilioService]

// After
import { SmsModule } from 'src/services/sms/sms.module';
imports: [SmsModule]
```

### 2. Update Service Imports

```typescript
// Before
import { TwilioService } from 'src/services/twilio/twilio.service';
constructor(private readonly twilioService: TwilioService) {}

// After
import { SmsService } from 'src/services/sms/sms.service';
constructor(private readonly smsService: SmsService) {}
```

### 3. Update Method Calls (Optional)

```typescript
// Old (still works)
await this.smsService.sendSms(phoneNumber, message);

// New (recommended - richer response)
const result = await this.smsService.sendSmsAsync({
  to: phoneNumber,
  message: message,
});

if (!result.success) {
  console.error(`Failed: ${result.errorMessage}`);
}
```

### 4. Environment Variables

The same environment variables work! Just add the provider:

```env
# Old
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...

# New (same variables + provider)
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
```

## Troubleshooting

### Issue: "SMS service unavailable"
- **Cause**: Missing or incorrect environment variables
- **Solution**: Verify all required variables are set correctly

### Issue: "Twilio configuration incomplete"
- **Cause**: Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN
- **Solution**: Check your environment variables

### Issue: "From phone number is required"
- **Cause**: TWILIO_PHONE_NUMBER not configured
- **Solution**: Set TWILIO_PHONE_NUMBER in environment

### Issue: Invalid phone number format
- **Cause**: Phone numbers must be in E.164 format
- **Solution**: Use format like `+1234567890` (+ followed by country code and number)

## Example Configuration for Popular Providers

### Twilio

```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### AWS SNS (Future)

```env
SMS_PROVIDER=aws-sns
AWS_SNS_REGION=us-east-1
AWS_SNS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SNS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

### Vonage (Future)

```env
SMS_PROVIDER=vonage
VONAGE_API_KEY=your-api-key
VONAGE_API_SECRET=your-api-secret
VONAGE_FROM_NUMBER=YourBrand
```

## Testing

### Unit Tests

```typescript
describe('SmsService', () => {
  let smsService: SmsService;
  let mockProvider: ISmsService;

  beforeEach(() => {
    mockProvider = {
      sendSmsAsync: jest.fn().mockResolvedValue({
        messageId: 'SM123',
        success: true,
        recipient: '+1234567890',
        status: 'sent',
      }),
      verifyConnectionAsync: jest.fn().mockResolvedValue(true),
    };

    smsService = new SmsService(mockProvider);
  });

  it('should send SMS via provider', async () => {
    const dto = {
      to: '+1234567890',
      message: 'Test message',
    };

    const result = await smsService.sendSmsAsync(dto);

    expect(mockProvider.sendSmsAsync).toHaveBeenCalledWith(dto);
    expect(result.success).toBe(true);
    expect(result.messageId).toBe('SM123');
  });
});
```

## Phone Number Format

All phone numbers must be in **E.164 format**:
- Start with `+` (plus sign)
- Followed by country code (1-3 digits)
- Followed by subscriber number (up to 15 digits total)

Examples:
- US: `+14155552671`
- UK: `+447911123456`
- India: `+919876543210`

Invalid formats will be rejected by the DTO validator.
