import { Request, Response } from "express";
import { container } from "tsyringe";
import { CreateStatementTransferUseCase } from "./CreateStatementTransferUseCase";

export class CreateStatementTransferController {
  async execute(request: Request, response: Response): Promise<Response> {
    const { id: sender_id } = request.user;
    const { user_id: receiver_id } = request.params;
    const { amount, description } = request.body;

    const createStatementTransferUseCase = container.resolve(CreateStatementTransferUseCase)

    const statement = await createStatementTransferUseCase.execute({
      sender_id,
      receiver_id,
      amount,
      description
    })

    return response.status(201).json(statement);
  }
}
