import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import {
  InitializeTransactionDto,
  PaystackCallbackDto,
  PaystackWebhookDto,
} from './dto/paystack.dto';
import { BadRequestException } from '../../common/exceptions';
import { PAYSTACK_WEBHOOK_SIGNATURE_KEY } from '../global/constants';

@Controller('api/v1/transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('initialize')
  async initializeTransaction(@Body() dto: InitializeTransactionDto) {
    return await this.transactionsService.initializePaystackTransaction(dto);
  }

  @Get('callback')
  async verifyTransaction(@Query() query: PaystackCallbackDto) {
    return await this.transactionsService.verifyTransaction(query);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async paymentWebhookHandler(
    @Body() dto: PaystackWebhookDto,
    @Headers() headers = {},
  ) {
    const result = await this.transactionsService.handlePaystackWebhook(
      dto,
      `${headers[PAYSTACK_WEBHOOK_SIGNATURE_KEY]}`,
    );

    if (!result) {
      throw new BadRequestException('Invalid webhook request', '');
    }
  }

  @Get()
  findAll() {
    return this.transactionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(+id, updateTransactionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.transactionsService.remove(+id);
  }
}
