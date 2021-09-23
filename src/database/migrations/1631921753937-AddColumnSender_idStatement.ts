import {MigrationInterface, QueryRunner, TableColumn, TableForeignKey} from "typeorm";

export class AddColumnSenderIdStatement1631921753937 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'statements',
      'type',
      new TableColumn({
        name: 'type',
        type: 'enum',
        enum: ['deposit', 'withdraw', 'transfer'],
      })
    )

    await queryRunner.addColumn(
      'statements',
      new TableColumn({
        name: 'sender_id',
        type: 'uuid',
        isNullable: true,
      })
    );

    await queryRunner.createForeignKey(
      'statements',
      new TableForeignKey({
        name: 'statements_transfer',
        columnNames: ['sender_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('statements','statements_transfer');
    await queryRunner.dropColumn('statements', 'sender_id');
    await queryRunner.changeColumn(
      'statements',
      'type',
      new TableColumn({
        name: 'type',
        type: 'enum',
        enum: ['deposit', 'withdraw'],
      })
    )
  }
}
