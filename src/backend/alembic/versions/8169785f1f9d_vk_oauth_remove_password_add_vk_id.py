"""vk_oauth_remove_password_add_vk_id

Revision ID: 8169785f1f9d
Revises: 5ad5305e8e47
Create Date: 2026-06-28 09:21:09.117404

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8169785f1f9d'
down_revision: Union[str, Sequence[str], None] = '5ad5305e8e47'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Удаляем существующих пользователей (логин/пароль больше не нужны)
    op.execute("DELETE FROM users")

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('vk_id', sa.String(length=20), nullable=False))
        batch_op.add_column(sa.Column('first_name', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('last_name', sa.String(length=100), nullable=True))
        batch_op.alter_column('username',
               existing_type=sa.VARCHAR(length=100),
               nullable=True)
        batch_op.create_unique_constraint('uq_users_vk_id', ['vk_id'])
        batch_op.drop_column('password_hash')

    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DELETE FROM users")

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('password_hash', sa.VARCHAR(length=255), nullable=False))
        batch_op.drop_constraint('uq_users_vk_id', type_='unique')
        batch_op.alter_column('username',
               existing_type=sa.VARCHAR(length=100),
               nullable=False)
        batch_op.drop_column('last_name')
        batch_op.drop_column('first_name')
        batch_op.drop_column('vk_id')
