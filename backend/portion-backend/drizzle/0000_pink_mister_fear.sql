CREATE TABLE "ai_services" (
	"id" text PRIMARY KEY NOT NULL,
	"price" numeric(12, 6) NOT NULL,
	"platform_fee" numeric(12, 6) NOT NULL,
	"description" text NOT NULL,
	"category" text,
	"pricing_scheme" text DEFAULT 'pay-per-use',
	"prepaid_discount" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nonces" (
	"nonce" text PRIMARY KEY NOT NULL,
	"wallet_address" text NOT NULL,
	"used_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prepaid_balances" (
	"wallet_address" text PRIMARY KEY NOT NULL,
	"balance" numeric(18, 6) DEFAULT '0' NOT NULL,
	"last_topup" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prepaid_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"wallet_address" text NOT NULL,
	"type" text NOT NULL,
	"amount" numeric(18, 6) NOT NULL,
	"service_id" text,
	"payment_tx" text,
	"balance_after" numeric(18, 6) NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_id" text PRIMARY KEY NOT NULL,
	"wallet_address" text NOT NULL,
	"nonce" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "usage_metrics" (
	"id" text PRIMARY KEY NOT NULL,
	"wallet_address" text NOT NULL,
	"service_id" text NOT NULL,
	"payment_scheme" text NOT NULL,
	"amount" numeric(18, 6),
	"session_id" text,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"metadata" text
);
--> statement-breakpoint
CREATE TABLE "waitlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "waitlist_email_unique" UNIQUE("email")
);
