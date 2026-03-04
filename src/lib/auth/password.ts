import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashInviteCode(inviteCode: string): Promise<string> {
  return bcrypt.hash(inviteCode, SALT_ROUNDS);
}

export async function verifyInviteCode(
  plainCode: string,
  hashedCode: string
): Promise<boolean> {
  return bcrypt.compare(plainCode, hashedCode);
}
