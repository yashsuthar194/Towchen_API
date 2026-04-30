-- CreateTable
CREATE TABLE "_serviceTovendor" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_serviceTovendor_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_serviceTovendor_B_index" ON "_serviceTovendor"("B");
