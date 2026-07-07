import React, { useState } from 'react';
import Button from '@core/ui/Button';
import { TeacherProfile } from '@core/types';
import { formatMaskedBankAccount } from '@core/utils/bank';
import { Heart, MapPin, Briefcase, Clock, Landmark, Award, Banknote, GraduationCap } from 'lucide-react';
import { beaSectionTitle, beaKicker, beaCaption } from '@core/ui/beaTheme';

interface TeacherBeneficiaryCardProps {
  profile: TeacherProfile;
  institutionName: string;
  layout?: 'featured' | 'grid';
  testimonial?: string;
  onSponsor?: (profile: TeacherProfile) => void;
}

const TeacherBeneficiaryCard: React.FC<TeacherBeneficiaryCardProps> = ({
  profile,
  institutionName,
  layout = 'grid',
  testimonial,
  onSponsor,
}) => {
  const [heroBroken, setHeroBroken] = useState(false);
  const [photoBroken, setPhotoBroken] = useState(false);

  const reasonText = testimonial ?? profile.reason ?? '';
  const reasonPreview =
    reasonText.length > 220 ? `${reasonText.slice(0, 217)}...` : reasonText;

  const metaItems = [
    profile.age ? { icon: Clock, label: 'Usia', value: `${profile.age} tahun` } : null,
    { icon: Briefcase, label: 'Mengajar', value: `${profile.yearsOfService} tahun` },
    profile.region
      ? { icon: MapPin, label: 'Wilayah', value: profile.region }
      : null,
    {
      icon: Landmark,
      label: 'Rekening',
      value: formatMaskedBankAccount(profile.bankName, profile.bankAccountNumber),
    },
    {
      icon: Award,
      label: 'Bantuan diterima',
      value: `${profile.totalReceivedCount ?? 0}x • Rp ${(profile.totalReceivedAmount ?? 0).toLocaleString('id-ID')}`,
    },
  ].filter(Boolean) as { icon: typeof Clock; label: string; value: string }[];

  if (layout === 'featured') {
    return (
      <div className="flex flex-col md:flex-row gap-5 items-start">
        {!photoBroken ? (
          <img
            src={profile.photoUrl}
            alt={profile.fullName}
            onError={() => setPhotoBroken(true)}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border-2 border-bea-line shadow-sm shrink-0 mx-auto md:mx-0"
          />
        ) : (
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-bea-line bg-bea-ivory flex items-center justify-center shrink-0 mx-auto md:mx-0">
            <GraduationCap size={28} className="text-bea-copper-soft" />
          </div>
        )}
        <div className="space-y-1.5 flex-1 min-w-0">
          <h3 className={`${beaSectionTitle} text-lg`}>{profile.fullName}</h3>
          <p className={beaKicker}>{profile.jobTitle}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs bg-bea-copper/10 text-bea-copper-dark px-3 py-0.5 rounded-full font-semibold border border-bea-copper/20">
              Gaji: Rp {profile.monthlySalary.toLocaleString('id-ID')}/bln
            </span>
            <span className="text-[11px] font-bold text-bea-sage-muted uppercase">{institutionName}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            {metaItems.slice(0, 4).map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-[11px] text-bea-sage">
                <item.icon size={12} className="text-bea-copper shrink-0" />
                <span className="font-semibold text-bea-sage-muted">{item.label}:</span>
                <span className="truncate">{item.value}</span>
              </div>
            ))}
          </div>
          <blockquote className="text-xs italic text-bea-sage border-l-2 border-bea-copper pl-3 leading-relaxed mt-2.5">
            &ldquo;{reasonPreview}&rdquo;
          </blockquote>
          {onSponsor && (
            <div className="pt-3.5 flex">
              <Button onClick={() => onSponsor(profile)} size="sm" className="text-xs font-semibold flex items-center gap-1.5">
                <Heart size={13} className="fill-current text-white" />
                Sponsori & Hubungkan Sebagai Donatur Asuh
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <article className="portal-beneficiary-card">
      <div className="portal-beneficiary-card-hero">
        {profile.teachingPhotoUrl && !heroBroken ? (
          <img
            src={profile.teachingPhotoUrl}
            alt=""
            onError={() => setHeroBroken(true)}
          />
        ) : (
          <div className="portal-beneficiary-card-hero-fallback" aria-hidden>
            <GraduationCap size={32} strokeWidth={1.5} />
          </div>
        )}
        {!photoBroken ? (
          <img
            src={profile.photoUrl}
            alt={profile.fullName}
            onError={() => setPhotoBroken(true)}
            className="portal-beneficiary-card-avatar"
          />
        ) : (
          <div className="portal-beneficiary-card-avatar flex items-center justify-center bg-bea-ivory">
            <GraduationCap size={20} className="text-bea-copper-soft" />
          </div>
        )}
      </div>

      <div className="portal-beneficiary-card-body">
        <div>
          <h3 className={`${beaSectionTitle} text-base`}>{profile.fullName}</h3>
          <p className={`${beaKicker} mt-0.5`}>{profile.jobTitle}</p>
          <p className={`${beaCaption} mt-1`}>{institutionName}</p>
        </div>

        <dl className="grid grid-cols-1 gap-1.5 text-[11px]">
          {metaItems.map((item) => (
            <div key={item.label} className="flex items-start gap-2 text-bea-sage">
              <item.icon size={12} className="text-bea-copper mt-0.5 shrink-0" />
              <dt className="font-semibold text-bea-sage-muted shrink-0">{item.label}</dt>
              <dd className="flex-1 min-w-0 break-words">{item.value}</dd>
            </div>
          ))}
          <div className="flex items-start gap-2 text-bea-sage">
            <Banknote size={12} className="text-bea-copper mt-0.5 shrink-0" />
            <dt className="font-semibold text-bea-sage-muted shrink-0">Gaji honorer</dt>
            <dd>Rp {profile.monthlySalary.toLocaleString('id-ID')}/bln</dd>
          </div>
        </dl>

        <p className="text-xs italic text-bea-sage line-clamp-3 leading-relaxed border-l-2 border-bea-copper pl-2">
          {reasonPreview}
        </p>

        {onSponsor && (
          <Button
            onClick={() => onSponsor(profile)}
            size="sm"
            className="w-full mt-auto text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <Heart size={13} className="fill-current" />
            Jadikan Guru Asuh
          </Button>
        )}
      </div>
    </article>
  );
};

export default TeacherBeneficiaryCard;
