export type CountryCode = "ES" | "AR";

export type LocationCity = {
  name: string;
  neighborhoods: string[];
};

export type LocationProvince = {
  name: string;
  cities: LocationCity[];
};

export type LocationCountry = {
  code: CountryCode;
  name: string;
  provinces: LocationProvince[];
};

/** Catálogo curado: solo valores reales, cascada país → provincia → ciudad → barrio. */
export const LOCATIONS: LocationCountry[] = [
  {
    code: "ES",
    name: "España",
    provinces: [
      {
        name: "Madrid",
        cities: [
          {
            name: "Madrid",
            neighborhoods: [
              "Malasaña",
              "Lavapiés",
              "Chamberí",
              "Salamanca",
              "Retiro",
              "La Latina",
              "Chueca",
              "Argüelles",
              "Usera",
              "Vallecas",
              "Tetuán",
              "Moncloa",
            ],
          },
          {
            name: "Alcalá de Henares",
            neighborhoods: ["Centro", "Espartales", "Reyes Católicos"],
          },
          {
            name: "Getafe",
            neighborhoods: ["Centro", "El Bercial", "Sector III"],
          },
          {
            name: "Móstoles",
            neighborhoods: ["Centro", "Estudiantes", "Iviasa"],
          },
        ],
      },
      {
        name: "Sevilla",
        cities: [
          {
            name: "Sevilla",
            neighborhoods: [
              "Triana",
              "Santa Cruz",
              "Macarena",
              "Nervión",
              "Los Remedios",
              "Alameda",
              "Sevilla Este",
              "Cerro-Amate",
              "Bellavista",
            ],
          },
          {
            name: "Dos Hermanas",
            neighborhoods: ["Centro", "Montequinto", "Fuente del Rey"],
          },
          {
            name: "Alcalá de Guadaíra",
            neighborhoods: ["Centro", "La Paz", "San Miguel"],
          },
        ],
      },
      {
        name: "Barcelona",
        cities: [
          {
            name: "Barcelona",
            neighborhoods: [
              "Gràcia",
              "Eixample",
              "El Born",
              "El Raval",
              "Sants",
              "Poblenou",
              "Sarrià",
              "Horta",
              "Les Corts",
              "Barceloneta",
            ],
          },
          {
            name: "L'Hospitalet de Llobregat",
            neighborhoods: ["Centre", "Collblanc", "Santa Eulàlia"],
          },
          {
            name: "Badalona",
            neighborhoods: ["Centre", "La Salut", "Gorg"],
          },
        ],
      },
      {
        name: "Valencia",
        cities: [
          {
            name: "Valencia",
            neighborhoods: [
              "Ruzafa",
              "El Carmen",
              "Benimaclet",
              "Ciutat Vella",
              "Campanar",
              "Patraix",
              "Algirós",
              "Extramurs",
            ],
          },
          {
            name: "Torrent",
            neighborhoods: ["Centro", "El Vedat", "Monte Sit"],
          },
          {
            name: "Paterna",
            neighborhoods: ["Centro", "La Canyada", "Terramelar"],
          },
        ],
      },
      {
        name: "Bizkaia",
        cities: [
          {
            name: "Bilbao",
            neighborhoods: [
              "Casco Viejo",
              "Abando",
              "Deusto",
              "Indautxu",
              "San Francisco",
              "Begoña",
              "Rekalde",
            ],
          },
          {
            name: "Barakaldo",
            neighborhoods: ["Centro", "Cruces", "Lutxana"],
          },
          {
            name: "Getxo",
            neighborhoods: ["Las Arenas", "Algorta", "Neguri"],
          },
        ],
      },
      {
        name: "A Coruña",
        cities: [
          {
            name: "A Coruña",
            neighborhoods: [
              "Ciudad Vieja",
              "Orzán",
              "Riazor",
              "Agra del Orzán",
              "Elviña",
              "Monte Alto",
            ],
          },
          {
            name: "Santiago de Compostela",
            neighborhoods: ["Casco Histórico", "Ensanche", "Vite"],
          },
          {
            name: "Ferrol",
            neighborhoods: ["Esteiro", "Recimil", "Caranza"],
          },
        ],
      },
      {
        name: "Pontevedra",
        cities: [
          {
            name: "Vigo",
            neighborhoods: ["Casco Vello", "Bouzas", "Teis", "Coia", "Navia"],
          },
          {
            name: "Pontevedra",
            neighborhoods: ["Centro Histórico", "Campolongo", "Mollavao"],
          },
        ],
      },
      {
        name: "Málaga",
        cities: [
          {
            name: "Málaga",
            neighborhoods: [
              "Centro Histórico",
              "Soho",
              "El Palo",
              "Teatinos",
              "Pedregalejo",
              "Huelin",
              "Ciudad Jardín",
            ],
          },
          {
            name: "Marbella",
            neighborhoods: ["Casco Antiguo", "Nueva Andalucía", "San Pedro"],
          },
          {
            name: "Torremolinos",
            neighborhoods: ["Centro", "La Carihuela", "El Bajondillo"],
          },
        ],
      },
      {
        name: "Zaragoza",
        cities: [
          {
            name: "Zaragoza",
            neighborhoods: [
              "Casco Histórico",
              "Delicias",
              "Universidad",
              "Actur",
              "Las Fuentes",
              "Torrero",
              "Centro",
            ],
          },
          {
            name: "Calatayud",
            neighborhoods: ["Centro", "Huerta Baja"],
          },
        ],
      },
      {
        name: "Granada",
        cities: [
          {
            name: "Granada",
            neighborhoods: [
              "Albaicín",
              "Realejo",
              "Centro",
              "Zaidín",
              "Chana",
              "Ronda",
            ],
          },
        ],
      },
      {
        name: "Alicante",
        cities: [
          {
            name: "Alicante",
            neighborhoods: [
              "Centro",
              "Campoamor",
              "San Blas",
              "Playa de San Juan",
              "Benalúa",
            ],
          },
        ],
      },
      {
        name: "Murcia",
        cities: [
          {
            name: "Murcia",
            neighborhoods: ["Centro", "La Flota", "Espinardo", "Vistalegre"],
          },
        ],
      },
      {
        name: "Asturias",
        cities: [
          {
            name: "Oviedo",
            neighborhoods: ["Centro", "Ciudad Naranco", "Tenderina"],
          },
          {
            name: "Gijón",
            neighborhoods: ["Centro", "Cimavilla", "El Llano", "La Calzada"],
          },
        ],
      },
      {
        name: "Illes Balears",
        cities: [
          {
            name: "Palma",
            neighborhoods: ["Centro", "El Terreno", "Son Armadams", "Pere Garau"],
          },
        ],
      },
      {
        name: "Las Palmas",
        cities: [
          {
            name: "Las Palmas de Gran Canaria",
            neighborhoods: ["Vegueta", "Triana", "Guanarteme", "Alcaravaneras"],
          },
        ],
      },
    ],
  },
  {
    code: "AR",
    name: "Argentina",
    provinces: [
      {
        name: "CABA",
        cities: [
          {
            name: "Buenos Aires",
            neighborhoods: [
              "Palermo",
              "San Telmo",
              "Recoleta",
              "Belgrano",
              "Caballito",
              "Villa Crespo",
              "Colegiales",
              "Almagro",
              "Barracas",
              "Núñez",
              "Villa Urquiza",
              "Boedo",
            ],
          },
        ],
      },
      {
        name: "Buenos Aires",
        cities: [
          {
            name: "La Plata",
            neighborhoods: ["Centro", "Gonnet", "City Bell"],
          },
          {
            name: "Mar del Plata",
            neighborhoods: ["Centro", "La Perla", "Los Troncos"],
          },
          {
            name: "San Isidro",
            neighborhoods: ["Centro", "Acassuso", "Béccar"],
          },
        ],
      },
      {
        name: "Córdoba",
        cities: [
          {
            name: "Córdoba",
            neighborhoods: ["Nueva Córdoba", "Centro", "Cerro de las Rosas", "Güemes"],
          },
        ],
      },
      {
        name: "Santa Fe",
        cities: [
          {
            name: "Rosario",
            neighborhoods: ["Centro", "Pichincha", "Fisherton", "Echesortu"],
          },
        ],
      },
      {
        name: "Mendoza",
        cities: [
          {
            name: "Mendoza",
            neighborhoods: ["Centro", "Ciudad", "Godoy Cruz"],
          },
        ],
      },
    ],
  },
];

export function getCountry(code: string): LocationCountry | undefined {
  return LOCATIONS.find((c) => c.code === code);
}

export function getProvinces(countryCode: string): LocationProvince[] {
  return getCountry(countryCode)?.provinces ?? [];
}

export function getCities(
  countryCode: string,
  provinceName: string,
): LocationCity[] {
  return (
    getProvinces(countryCode).find((p) => p.name === provinceName)?.cities ??
    []
  );
}

export function getNeighborhoods(
  countryCode: string,
  provinceName: string,
  cityName: string,
): string[] {
  return (
    getCities(countryCode, provinceName).find((c) => c.name === cityName)
      ?.neighborhoods ?? []
  );
}

export function isValidLocation(input: {
  country: string;
  province: string;
  city: string;
  neighborhood?: string;
}): boolean {
  const cities = getCities(input.country, input.province);
  const city = cities.find((c) => c.name === input.city);
  if (!city) return false;
  if (!input.neighborhood) return true;
  return city.neighborhoods.includes(input.neighborhood);
}
