// src/lib/domain/allergens.ts

interface Allergen {
  id: number;
  code: string;
  nameEs: string;
  icon: string;
}

const EU_ALLERGENS: Allergen[] = [
  { id: 1,  code: 'GLUTEN',       nameEs: 'Gluten',                      icon: 'gluten.svg' },
  { id: 2,  code: 'CRUSTACEANS',   nameEs: 'Crustáceos',                  icon: 'crustaceans.svg' },
  { id: 3,  code: 'EGGS',          nameEs: 'Huevos',                      icon: 'eggs.svg' },
  { id: 4,  code: 'FISH',          nameEs: 'Pescado',                     icon: 'fish.svg' },
  { id: 5,  code: 'PEANUTS',       nameEs: 'Cacahuetes',                  icon: 'peanuts.svg' },
  { id: 6,  code: 'SOY',           nameEs: 'Soja',                        icon: 'soy.svg' },
  { id: 7,  code: 'DAIRY',         nameEs: 'Lácteos',                     icon: 'dairy.svg' },
  { id: 8,  code: 'TREE_NUTS',     nameEs: 'Frutos de cáscara',           icon: 'tree-nuts.svg' },
  { id: 9,  code: 'CELERY',        nameEs: 'Apio',                        icon: 'celery.svg' },
  { id: 10, code: 'MUSTARD',       nameEs: 'Mostaza',                     icon: 'mustard.svg' },
  { id: 11, code: 'SESAME',        nameEs: 'Sésamo',                      icon: 'sesame.svg' },
  { id: 12, code: 'SULPHITES',     nameEs: 'Dióxido de azufre/Sulfitos',  icon: 'sulphites.svg' },
  { id: 13, code: 'LUPIN',         nameEs: 'Altramuces',                  icon: 'lupin.svg' },
  { id: 14, code: 'MOLLUSCS',      nameEs: 'Moluscos',                    icon: 'molluscs.svg' },
];

export { EU_ALLERGENS };
export type { Allergen };
