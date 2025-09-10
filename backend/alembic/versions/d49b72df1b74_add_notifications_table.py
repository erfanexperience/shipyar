"""Add notifications table

Revision ID: d49b72df1b74
Revises: 232e5177963b
Create Date: 2025-09-09 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'd49b72df1b74'
down_revision: Union[str, None] = '232e5177963b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create notification type enum
    op.execute("CREATE TYPE notificationtype AS ENUM ('offer_received', 'offer_accepted', 'offer_declined', 'order_matched', 'order_purchased', 'order_in_transit', 'order_delivered', 'order_completed', 'order_cancelled', 'message_received', 'payment_received', 'review_received', 'system')")
    
    # Create notifications table
    op.create_table('notifications',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('type', postgresql.ENUM('offer_received', 'offer_accepted', 'offer_declined', 'order_matched', 'order_purchased', 'order_in_transit', 'order_delivered', 'order_completed', 'order_cancelled', 'message_received', 'payment_received', 'review_received', 'system', name='notificationtype', create_type=False), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('data', sa.JSON(), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=False, default=False),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create index on user_id and is_read for faster queries
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'])
    op.create_index('ix_notifications_user_id_is_read', 'notifications', ['user_id', 'is_read'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_notifications_user_id_is_read', table_name='notifications')
    op.drop_index('ix_notifications_user_id', table_name='notifications')
    
    # Drop table
    op.drop_table('notifications')
    
    # Drop enum type
    op.execute("DROP TYPE IF EXISTS notificationtype")