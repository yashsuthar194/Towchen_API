import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConsentType, OrderStatus, consent_request } from '@prisma/client';
import { OrderClosureConsentHandler } from './order-closure-consent.handler';

describe('OrderClosureConsentHandler', () => {
  let handler: OrderClosureConsentHandler;
  let tx: any;

  beforeEach(() => {
    handler = new OrderClosureConsentHandler();
    tx = {
      order: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
  });

  it('should have consentType set to OrderClosure', () => {
    expect(handler.consentType).toBe(ConsentType.OrderClosure);
  });

  it('should throw BadRequestException if entity_id is null', async () => {
    const consent = { id: 1, entity_id: null } as any;
    await expect(handler.execute(consent, tx)).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException if order does not exist', async () => {
    const consent = { id: 1, entity_id: 999 } as any;
    tx.order.findUnique.mockResolvedValue(null);
    await expect(handler.execute(consent, tx)).rejects.toThrow(NotFoundException);
  });

  it('should transition order status to Closed', async () => {
    const consent = { id: 1, entity_id: 10 } as any;
    tx.order.findUnique.mockResolvedValue({
      id: 10,
      formated_id: 'ORD0000010',
      status: OrderStatus.Completed,
    });
    tx.order.update.mockResolvedValue({
      id: 10,
      status: OrderStatus.Closed,
    });

    await handler.execute(consent, tx);

    expect(tx.order.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { status: OrderStatus.Closed },
    });
  });

  it('should skip update if order is already Closed', async () => {
    const consent = { id: 1, entity_id: 10 } as any;
    tx.order.findUnique.mockResolvedValue({
      id: 10,
      formated_id: 'ORD0000010',
      status: OrderStatus.Closed,
    });

    await handler.execute(consent, tx);

    expect(tx.order.update).not.toHaveBeenCalled();
  });
});
