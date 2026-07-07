package store

import "bea-guru-api/internal/storage"

func validateTeacherMediaURLs(rules storage.MediaRules, photoURL, teachingPhotoURL string) error {
	if err := rules.ValidatePublicMediaURL(photoURL); err != nil {
		return ErrInvalidState
	}
	if err := rules.ValidatePublicMediaURL(teachingPhotoURL); err != nil {
		return ErrInvalidState
	}
	return nil
}

func validateReportPhotoURL(rules storage.MediaRules, photoURL string) error {
	if err := rules.ValidatePublicMediaURL(photoURL); err != nil {
		return ErrInvalidState
	}
	return nil
}
