export type CoingateInitTransactionDto = {
  order_id: string;
  price_amount: number;
  price_currency: string;
  receive_currency: string;
  title: string;
  description: string;
  callback_url: string;
  cancel_url: string;
  success_url: string;
  token: string;
};

export type CoingateInitTransactionResponseDto = {
  id: number;
  status: string;
  title: string;
  do_not_convert: boolean;
  orderable_type: string;
  orderable_id: number;
  price_currency: string;
  price_amount: string;
  receive_currency: string;
  receive_amount: string;
  created_at: string;
  order_id: string;
  payment_url: string;
  token: string;
};
