package geo

import "strings"

type Region struct {
	Label     string
	Latitude  float64
	Longitude float64
}

// Sinkron dengan fe/src/core/geo/indonesiaRegions.ts
var regions = []Region{
	{Label: "Aceh — Banda Aceh", Latitude: 5.5483, Longitude: 95.3238},
	{Label: "Sumatera Utara — Medan", Latitude: 3.5952, Longitude: 98.6722},
	{Label: "Sumatera Barat — Padang", Latitude: -0.9471, Longitude: 100.4172},
	{Label: "Riau — Pekanbaru", Latitude: 0.5071, Longitude: 101.4478},
	{Label: "Kepulauan Riau — Batam", Latitude: 1.1301, Longitude: 104.0530},
	{Label: "Jambi — Jambi", Latitude: -1.6101, Longitude: 103.6131},
	{Label: "Sumatera Selatan — Palembang", Latitude: -2.9761, Longitude: 104.7754},
	{Label: "Bangka Belitung — Pangkalpinang", Latitude: -2.1316, Longitude: 106.1169},
	{Label: "Bengkulu — Bengkulu", Latitude: -3.7928, Longitude: 102.2608},
	{Label: "Lampung — Bandar Lampung", Latitude: -5.4292, Longitude: 105.2625},
	{Label: "DKI Jakarta", Latitude: -6.2088, Longitude: 106.8456},
	{Label: "Jawa Barat — Bandung", Latitude: -6.9175, Longitude: 107.6191},
	{Label: "Jawa Barat — Bogor", Latitude: -6.5971, Longitude: 106.8060},
	{Label: "Jawa Barat — Cirebon", Latitude: -6.7320, Longitude: 108.5523},
	{Label: "Jawa Tengah — Semarang", Latitude: -6.9667, Longitude: 110.4167},
	{Label: "Jawa Tengah — Solo", Latitude: -7.5755, Longitude: 110.8243},
	{Label: "DI Yogyakarta", Latitude: -7.7956, Longitude: 110.3695},
	{Label: "Jawa Timur — Surabaya", Latitude: -7.2575, Longitude: 112.7521},
	{Label: "Jawa Timur — Malang", Latitude: -7.9666, Longitude: 112.6326},
	{Label: "Banten — Serang", Latitude: -6.1200, Longitude: 106.1503},
	{Label: "Bali — Denpasar", Latitude: -8.6705, Longitude: 115.2126},
	{Label: "NTB — Mataram", Latitude: -8.5833, Longitude: 116.1167},
	{Label: "NTT — Kupang", Latitude: -10.1772, Longitude: 123.6070},
	{Label: "Kalimantan Barat — Pontianak", Latitude: -0.0263, Longitude: 109.3425},
	{Label: "Kalimantan Tengah — Palangka Raya", Latitude: -2.2100, Longitude: 113.9200},
	{Label: "Kalimantan Selatan — Banjarmasin", Latitude: -3.3186, Longitude: 114.5944},
	{Label: "Kalimantan Timur — Samarinda", Latitude: -0.5022, Longitude: 117.1536},
	{Label: "Kalimantan Timur — Balikpapan", Latitude: -1.2379, Longitude: 116.8529},
	{Label: "Kalimantan Utara — Tarakan", Latitude: 3.3274, Longitude: 117.5785},
	{Label: "Sulawesi Utara — Manado", Latitude: 1.4748, Longitude: 124.8421},
	{Label: "Sulawesi Tengah — Palu", Latitude: -0.8999, Longitude: 119.8707},
	{Label: "Sulawesi Selatan — Makassar", Latitude: -5.1477, Longitude: 119.4327},
	{Label: "Sulawesi Tenggara — Kendari", Latitude: -3.9985, Longitude: 122.5130},
	{Label: "Sulawesi Barat — Mamuju", Latitude: -2.6726, Longitude: 118.8860},
	{Label: "Gorontalo", Latitude: 0.5435, Longitude: 123.0585},
	{Label: "Maluku — Ambon", Latitude: -3.6554, Longitude: 128.1908},
	{Label: "Maluku Utara — Ternate", Latitude: 0.7900, Longitude: 127.3848},
	{Label: "Papua Barat — Manokwari", Latitude: -0.8611, Longitude: 134.0620},
	{Label: "Papua — Jayapura", Latitude: -2.5337, Longitude: 140.7181},
	{Label: "Papua — Merauke", Latitude: -8.4961, Longitude: 140.3949},
}

var regionAliases = map[string]string{
	"jakarta":        "DKI Jakarta",
	"dki jakarta":    "DKI Jakarta",
	"bandung":        "Jawa Barat — Bandung",
	"bogor":          "Jawa Barat — Bogor",
	"cirebon":        "Jawa Barat — Cirebon",
	"surabaya":       "Jawa Timur — Surabaya",
	"malang":         "Jawa Timur — Malang",
	"semarang":       "Jawa Tengah — Semarang",
	"solo":           "Jawa Tengah — Solo",
	"yogyakarta":     "DI Yogyakarta",
	"jogja":          "DI Yogyakarta",
	"medan":          "Sumatera Utara — Medan",
	"padang":         "Sumatera Barat — Padang",
	"pekanbaru":      "Riau — Pekanbaru",
	"batam":          "Kepulauan Riau — Batam",
	"palembang":      "Sumatera Selatan — Palembang",
	"lampung":        "Lampung — Bandar Lampung",
	"bandar lampung": "Lampung — Bandar Lampung",
	"denpasar":       "Bali — Denpasar",
	"bali":           "Bali — Denpasar",
	"mataram":        "NTB — Mataram",
	"kupang":         "NTT — Kupang",
	"pontianak":      "Kalimantan Barat — Pontianak",
	"banjarmasin":    "Kalimantan Selatan — Banjarmasin",
	"samarinda":      "Kalimantan Timur — Samarinda",
	"balikpapan":     "Kalimantan Timur — Balikpapan",
	"manado":         "Sulawesi Utara — Manado",
	"makassar":       "Sulawesi Selatan — Makassar",
	"palu":           "Sulawesi Tengah — Palu",
	"kendari":        "Sulawesi Tenggara — Kendari",
	"mamuju":         "Sulawesi Barat — Mamuju",
	"sulawesi barat": "Sulawesi Barat — Mamuju",
	"ambon":          "Maluku — Ambon",
	"ternate":        "Maluku Utara — Ternate",
	"jayapura":       "Papua — Jayapura",
	"merauke":        "Papua — Merauke",
	"manokwari":      "Papua Barat — Manokwari",
	"aceh":           "Aceh — Banda Aceh",
	"banda aceh":     "Aceh — Banda Aceh",
}

var regionLookup map[string]Region

func init() {
	regionLookup = make(map[string]Region, len(regions)*2)
	for _, region := range regions {
		regionLookup[normalizeKey(region.Label)] = region
		if parts := strings.Split(region.Label, " — "); len(parts) == 2 {
			regionLookup[normalizeKey(parts[1])] = region
		}
	}
}

func normalizeKey(value string) string {
	return strings.Join(strings.Fields(strings.TrimSpace(strings.ToLower(value))), " ")
}

func FindRegion(label string) (Region, bool) {
	key := normalizeKey(label)
	if alias, ok := regionAliases[key]; ok {
		key = normalizeKey(alias)
	}
	region, ok := regionLookup[key]
	return region, ok
}

// ResolveCoords mengisi koordinat dari label wilayah jika belum ada.
func ResolveCoords(region string, latitude, longitude *float64) (lat, lng float64, canonicalRegion string, ok bool) {
	trimmed := strings.TrimSpace(region)
	regionMatch, found := FindRegion(trimmed)
	if found {
		canonicalRegion = regionMatch.Label
	} else if trimmed != "" {
		canonicalRegion = trimmed
	}

	if latitude != nil && longitude != nil && *latitude != 0 && *longitude != 0 {
		return *latitude, *longitude, canonicalRegion, true
	}

	if !found {
		return 0, 0, "", false
	}
	return regionMatch.Latitude, regionMatch.Longitude, regionMatch.Label, true
}
