-- Add branch enum for users.
CREATE TYPE "Branch" AS ENUM ('HEAD_OFFICE', 'SENYIUR', 'MUARA_PAHU');

-- Add required branch field for all users.
ALTER TABLE "User"
ADD COLUMN "branch" "Branch" NOT NULL DEFAULT 'HEAD_OFFICE';
