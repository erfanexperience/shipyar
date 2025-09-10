"""Create initial tables

Revision ID: 232e5177963b
Revises: 
Create Date: 2025-09-09 20:29:17.244653

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '232e5177963b'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enums
    op.execute("CREATE TYPE userrole AS ENUM ('shopper', 'traveler', 'both', 'admin')")
    op.execute("CREATE TYPE userstatus AS ENUM ('active', 'suspended', 'deactivated', 'pending_verification')")
    op.execute("CREATE TYPE orderstatus AS ENUM ('draft', 'active', 'matched', 'purchased', 'in_transit', 'delivered', 'completed', 'cancelled', 'disputed')")
    op.execute("CREATE TYPE offerstatus AS ENUM ('active', 'withdrawn', 'accepted', 'expired')")
    op.execute("CREATE TYPE messagetype AS ENUM ('text', 'image', 'document', 'system', 'location')")
    op.execute("CREATE TYPE paymentstatus AS ENUM ('pending', 'authorized', 'captured', 'refunded', 'failed', 'cancelled')")
    op.execute("CREATE TYPE transactiontype AS ENUM ('order_payment', 'platform_fee', 'traveler_payout', 'refund', 'dispute_resolution')")
    op.execute("CREATE TYPE verificationtype AS ENUM ('email', 'phone', 'identity', 'payment_method')")

    # Create countries table
    op.create_table('countries',
        sa.Column('code', sa.String(length=2), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=True),
        sa.Column('phone_prefix', sa.String(length=10), nullable=True),
        sa.Column('enabled', sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint('code')
    )
    
    # Create cities table
    op.create_table('cities',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('country_code', sa.String(length=2), nullable=False),
        sa.Column('latitude', sa.Numeric(precision=10, scale=8), nullable=True),
        sa.Column('longitude', sa.Numeric(precision=11, scale=8), nullable=True),
        sa.Column('timezone', sa.String(length=50), nullable=True),
        sa.Column('enabled', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['country_code'], ['countries.code'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create users table
    op.create_table('users',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role', postgresql.ENUM('shopper', 'traveler', 'both', 'admin', name='userrole', create_type=False), nullable=False),
        sa.Column('status', postgresql.ENUM('active', 'suspended', 'deactivated', 'pending_verification', name='userstatus', create_type=False), nullable=False),
        sa.Column('first_name', sa.String(length=100), nullable=False),
        sa.Column('last_name', sa.String(length=100), nullable=False),
        sa.Column('display_name', sa.String(length=100), nullable=True),
        sa.Column('avatar_url', sa.Text(), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('date_of_birth', sa.Date(), nullable=True),
        sa.Column('primary_country', sa.String(length=2), nullable=True),
        sa.Column('primary_city', sa.String(length=100), nullable=True),
        sa.Column('timezone', sa.String(length=50), nullable=True),
        sa.Column('email_verified', sa.Boolean(), nullable=True),
        sa.Column('phone_verified', sa.Boolean(), nullable=True),
        sa.Column('identity_verified', sa.Boolean(), nullable=True),
        sa.Column('payment_verified', sa.Boolean(), nullable=True),
        sa.Column('preferred_language', sa.String(length=5), nullable=True),
        sa.Column('preferred_currency', sa.String(length=3), nullable=True),
        sa.Column('shopper_rating', sa.Numeric(precision=3, scale=2), nullable=True),
        sa.Column('shopper_review_count', sa.Integer(), nullable=True),
        sa.Column('traveler_rating', sa.Numeric(precision=3, scale=2), nullable=True),
        sa.Column('traveler_review_count', sa.Integer(), nullable=True),
        sa.Column('total_orders_as_shopper', sa.Integer(), nullable=True),
        sa.Column('total_orders_as_traveler', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    
    # Create orders table
    op.create_table('orders',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('shopper_id', sa.UUID(), nullable=False),
        sa.Column('product_name', sa.String(length=255), nullable=False),
        sa.Column('product_url', sa.Text(), nullable=False),
        sa.Column('product_description', sa.Text(), nullable=True),
        sa.Column('product_image_url', sa.Text(), nullable=True),
        sa.Column('product_price', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('product_currency', sa.String(length=3), nullable=True),
        sa.Column('quantity', sa.Integer(), nullable=True),
        sa.Column('destination_country', sa.String(length=2), nullable=False),
        sa.Column('destination_city_id', sa.UUID(), nullable=True),
        sa.Column('destination_address', sa.Text(), nullable=True),
        sa.Column('deadline_date', sa.Date(), nullable=False),
        sa.Column('preferred_delivery_date', sa.Date(), nullable=True),
        sa.Column('reward_amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('reward_currency', sa.String(length=3), nullable=True),
        sa.Column('platform_fee', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('total_cost', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('status', postgresql.ENUM('draft', 'active', 'matched', 'purchased', 'in_transit', 'delivered', 'completed', 'cancelled', 'disputed', name='orderstatus', create_type=False), nullable=False),
        sa.Column('special_instructions', sa.Text(), nullable=True),
        sa.Column('weight_estimate', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('size_description', sa.String(length=100), nullable=True),
        sa.Column('matched_traveler_id', sa.UUID(), nullable=True),
        sa.Column('matched_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('purchased_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('shipped_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('delivered_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('amazon_asin', sa.String(length=20), nullable=True),
        sa.Column('amazon_title', sa.Text(), nullable=True),
        sa.Column('amazon_price', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('amazon_currency', sa.String(length=3), nullable=True),
        sa.Column('amazon_images', sa.JSON(), nullable=True),
        sa.Column('amazon_features', sa.JSON(), nullable=True),
        sa.Column('amazon_scraped_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['destination_city_id'], ['cities.id'], ),
        sa.ForeignKeyConstraint(['destination_country'], ['countries.code'], ),
        sa.ForeignKeyConstraint(['matched_traveler_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['shopper_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create offers table
    op.create_table('offers',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('order_id', sa.UUID(), nullable=False),
        sa.Column('traveler_id', sa.UUID(), nullable=False),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('proposed_delivery_date', sa.Date(), nullable=True),
        sa.Column('proposed_reward_amount', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('travel_route', sa.JSON(), nullable=True),
        sa.Column('status', postgresql.ENUM('active', 'withdrawn', 'accepted', 'expired', name='offerstatus', create_type=False), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ),
        sa.ForeignKeyConstraint(['traveler_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('order_id', 'traveler_id', name='unique_offer_per_traveler')
    )
    
    # Create conversations table
    op.create_table('conversations',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('order_id', sa.UUID(), nullable=False),
        sa.Column('shopper_id', sa.UUID(), nullable=False),
        sa.Column('traveler_id', sa.UUID(), nullable=False),
        sa.Column('unlocked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_unlocked', sa.Boolean(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('last_message_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('closed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ),
        sa.ForeignKeyConstraint(['shopper_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['traveler_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('order_id')
    )
    
    # Create messages table
    op.create_table('messages',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('conversation_id', sa.UUID(), nullable=False),
        sa.Column('sender_id', sa.UUID(), nullable=False),
        sa.Column('message_type', postgresql.ENUM('text', 'image', 'document', 'system', 'location', name='messagetype', create_type=False), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('filtered_content', sa.Text(), nullable=True),
        sa.Column('violations_detected', sa.JSON(), nullable=True),
        sa.Column('is_blocked', sa.Boolean(), nullable=True),
        sa.Column('attachment_url', sa.Text(), nullable=True),
        sa.Column('attachment_metadata', sa.JSON(), nullable=True),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('edited_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ),
        sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create payment_methods table
    op.create_table('payment_methods',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('provider', sa.String(length=50), nullable=False),
        sa.Column('provider_payment_method_id', sa.String(length=255), nullable=False),
        sa.Column('card_last_four', sa.String(length=4), nullable=True),
        sa.Column('card_brand', sa.String(length=20), nullable=True),
        sa.Column('expires_month', sa.Integer(), nullable=True),
        sa.Column('expires_year', sa.Integer(), nullable=True),
        sa.Column('is_default', sa.Boolean(), nullable=True),
        sa.Column('is_verified', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create transactions table
    op.create_table('transactions',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('order_id', sa.UUID(), nullable=True),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('payment_method_id', sa.UUID(), nullable=True),
        sa.Column('transaction_type', postgresql.ENUM('order_payment', 'platform_fee', 'traveler_payout', 'refund', 'dispute_resolution', name='transactiontype', create_type=False), nullable=False),
        sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False),
        sa.Column('status', postgresql.ENUM('pending', 'authorized', 'captured', 'refunded', 'failed', 'cancelled', name='paymentstatus', create_type=False), nullable=False),
        sa.Column('provider', sa.String(length=50), nullable=False),
        sa.Column('provider_transaction_id', sa.String(length=255), nullable=False),
        sa.Column('provider_response', sa.JSON(), nullable=True),
        sa.Column('failed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('failure_reason', sa.Text(), nullable=True),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ),
        sa.ForeignKeyConstraint(['payment_method_id'], ['payment_methods.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create escrow_holdings table
    op.create_table('escrow_holdings',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('order_id', sa.UUID(), nullable=False),
        sa.Column('transaction_id', sa.UUID(), nullable=False),
        sa.Column('total_amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('platform_fee', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('traveler_payout', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False),
        sa.Column('is_released', sa.Boolean(), nullable=True),
        sa.Column('released_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('release_transaction_id', sa.UUID(), nullable=True),
        sa.Column('is_disputed', sa.Boolean(), nullable=True),
        sa.Column('disputed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('dispute_resolution', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ),
        sa.ForeignKeyConstraint(['release_transaction_id'], ['transactions.id'], ),
        sa.ForeignKeyConstraint(['transaction_id'], ['transactions.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('order_id')
    )
    
    # Create order_status_history table
    op.create_table('order_status_history',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('order_id', sa.UUID(), nullable=False),
        sa.Column('old_status', postgresql.ENUM('draft', 'active', 'matched', 'purchased', 'in_transit', 'delivered', 'completed', 'cancelled', 'disputed', name='orderstatus', create_type=False), nullable=True),
        sa.Column('new_status', postgresql.ENUM('draft', 'active', 'matched', 'purchased', 'in_transit', 'delivered', 'completed', 'cancelled', 'disputed', name='orderstatus', create_type=False), nullable=False),
        sa.Column('changed_by', sa.UUID(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['changed_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create reviews table
    op.create_table('reviews',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('order_id', sa.UUID(), nullable=False),
        sa.Column('reviewer_id', sa.UUID(), nullable=False),
        sa.Column('reviewed_id', sa.UUID(), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('reviewer_role', sa.Text(), nullable=False),
        sa.Column('response', sa.Text(), nullable=True),
        sa.Column('response_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ),
        sa.ForeignKeyConstraint(['reviewed_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['reviewer_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('reviewer_id', 'order_id', name='unique_review_per_order')
    )
    
    # Create user_sessions table
    op.create_table('user_sessions',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('token_hash', sa.String(length=255), nullable=False),
        sa.Column('device_info', sa.JSON(), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_sessions_token_hash'), 'user_sessions', ['token_hash'], unique=False)
    
    # Create password_reset_tokens table
    op.create_table('password_reset_tokens',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('token_hash', sa.String(length=255), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token_hash')
    )
    
    # Create user_verifications table
    op.create_table('user_verifications',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('verification_type', postgresql.ENUM('email', 'phone', 'identity', 'payment_method', name='verificationtype', create_type=False), nullable=False),
        sa.Column('verification_data', sa.JSON(), nullable=True),
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('user_verifications')
    op.drop_table('password_reset_tokens')
    op.drop_index(op.f('ix_user_sessions_token_hash'), table_name='user_sessions')
    op.drop_table('user_sessions')
    op.drop_table('reviews')
    op.drop_table('order_status_history')
    op.drop_table('escrow_holdings')
    op.drop_table('transactions')
    op.drop_table('payment_methods')
    op.drop_table('messages')
    op.drop_table('conversations')
    op.drop_table('offers')
    op.drop_table('orders')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    op.drop_table('cities')
    op.drop_table('countries')
    
    # Drop enums
    op.execute("DROP TYPE IF EXISTS userrole")
    op.execute("DROP TYPE IF EXISTS userstatus")
    op.execute("DROP TYPE IF EXISTS orderstatus")
    op.execute("DROP TYPE IF EXISTS offerstatus")
    op.execute("DROP TYPE IF EXISTS messagetype")
    op.execute("DROP TYPE IF EXISTS paymentstatus")
    op.execute("DROP TYPE IF EXISTS transactiontype")
    op.execute("DROP TYPE IF EXISTS verificationtype")