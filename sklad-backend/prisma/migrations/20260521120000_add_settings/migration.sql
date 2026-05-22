-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL DEFAULT '1',
    "companyName" TEXT NOT NULL DEFAULT 'Sklad',
    "companyPhone" TEXT,
    "companyAddress" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'UZS',
    "taxPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "smsTemplate" TEXT NOT NULL DEFAULT 'Hurmatli {name}, {amount} so''m qarzingiz muddati {date} da tugaydi.',
    "reminderDays" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);
