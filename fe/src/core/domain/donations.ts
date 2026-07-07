import { Donation, DonationVerificationStatus } from '../types';

/** Legacy rows tanpa status dianggap terverifikasi (data pra-migrasi 00016). */
export function isVerifiedDonation(d: Donation): boolean {
  const status = d.verificationStatus;
  if (!status) return true;
  return status === DonationVerificationStatus.VERIFIED;
}

export function isPendingDonation(d: Donation): boolean {
  return d.verificationStatus === DonationVerificationStatus.PENDING;
}

export function isRejectedDonation(d: Donation): boolean {
  return d.verificationStatus === DonationVerificationStatus.REJECTED;
}

/** Hanya donasi terverifikasi ke guru tertentu membentuk relasi Guru Binaan. */
export function sponsoredTeacherProfileIds(donations: Donation[]): Set<string> {
  const ids = new Set<string>();
  for (const d of donations) {
    if (d.teacherProfileId && isVerifiedDonation(d)) {
      ids.add(d.teacherProfileId);
    }
  }
  return ids;
}

export function verifiedDonations(donations: Donation[]): Donation[] {
  return donations.filter(isVerifiedDonation);
}
