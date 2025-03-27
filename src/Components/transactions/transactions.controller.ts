import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InitializeTransactionDto } from './dto/create-transaction.dto';
import { PaystackCallbackDto, PaystackWebhookDto } from './dto/paystack.dto';
import { BadRequestException } from '../../common/exceptions';
import { PAYSTACK_WEBHOOK_SIGNATURE_KEY } from '../global/constants';
import { Request } from 'express';

@Controller('api/v1/transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('paystack/initialize')
  initializePaystackTransaction(@Body() dto: InitializeTransactionDto) {
    return this.transactionsService.initializePaystackTransaction(dto);
  }

  @Get('paystack/callback')
  verifyPaystackTransaction(@Query() query: PaystackCallbackDto, @Req() req: Request) {
    return this.transactionsService.verifyPaystackTransaction(query, req);
  }

  @Post('paystack/webhook')
  @HttpCode(HttpStatus.OK)
  async paystackPaymentWebhookHandler(
    @Body() dto: PaystackWebhookDto,
    @Headers() headers: Record<string, string>,
    @Req() req: Request,
  ) {
    const signature = headers?.[PAYSTACK_WEBHOOK_SIGNATURE_KEY] || '';
    const result = await this.transactionsService.handlePaystackWebhook(
      dto,
      signature,
      req,
    );

    if (!result) throw new BadRequestException('Invalid webhook request', '');
  }

  @Post('coingate/initialize')
  initializeCoingateTransaction(@Body() dto: InitializeTransactionDto) {
    return this.transactionsService.initializeCoingateTransaction(dto);
  }

  @Post('coingate/callback')
  @HttpCode(HttpStatus.OK)
  verifyCoingateTransaction(@Req() req: Request, @Body() body) {
    return this.transactionsService.verifyCoingateTransaction(req, body);
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
