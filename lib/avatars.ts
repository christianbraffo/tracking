// Avatars 3D : Microsoft Fluent Emoji (licence MIT), servis par jsDelivr.
const BASE = "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets";

// [id, dossier, fichier]
const RAW: [string, string, string][] = [
  ["man-mage", "Man mage", "Default/3D/man_mage_3d_default.png"],
  ["woman-mage", "Woman mage", "Default/3D/woman_mage_3d_default.png"],
  ["man-superhero", "Man superhero", "Default/3D/man_superhero_3d_default.png"],
  ["woman-superhero", "Woman superhero", "Default/3D/woman_superhero_3d_default.png"],
  ["man-supervillain", "Man supervillain", "Default/3D/man_supervillain_3d_default.png"],
  ["woman-supervillain", "Woman supervillain", "Default/3D/woman_supervillain_3d_default.png"],
  ["ninja", "Ninja", "Default/3D/ninja_3d_default.png"],
  ["man-astronaut", "Man astronaut", "Default/3D/man_astronaut_3d_default.png"],
  ["woman-astronaut", "Woman astronaut", "Default/3D/woman_astronaut_3d_default.png"],
  ["man-vampire", "Man vampire", "Default/3D/man_vampire_3d_default.png"],
  ["woman-vampire", "Woman vampire", "Default/3D/woman_vampire_3d_default.png"],
  ["man-fairy", "Man fairy", "Default/3D/man_fairy_3d_default.png"],
  ["woman-fairy", "Woman fairy", "Default/3D/woman_fairy_3d_default.png"],
  ["man-genie", "Man genie", "3D/man_genie_3d.png"],
  ["woman-genie", "Woman genie", "3D/woman_genie_3d.png"],
  ["man-elf", "Man elf", "Default/3D/man_elf_3d_default.png"],
  ["woman-elf", "Woman elf", "Default/3D/woman_elf_3d_default.png"],
  ["prince", "Prince", "Default/3D/prince_3d_default.png"],
  ["princess", "Princess", "Default/3D/princess_3d_default.png"],
  ["man-detective", "Man detective", "Default/3D/man_detective_3d_default.png"],
  ["woman-detective", "Woman detective", "Default/3D/woman_detective_3d_default.png"],
  ["man-artist", "Man artist", "Default/3D/man_artist_3d_default.png"],
  ["woman-artist", "Woman artist", "Default/3D/woman_artist_3d_default.png"],
  ["man-technologist", "Man technologist", "Default/3D/man_technologist_3d_default.png"],
  ["woman-technologist", "Woman technologist", "Default/3D/woman_technologist_3d_default.png"],
  ["man-singer", "Man singer", "Default/3D/man_singer_3d_default.png"],
  ["woman-singer", "Woman singer", "Default/3D/woman_singer_3d_default.png"],
  ["man-cook", "Man cook", "Default/3D/man_cook_3d_default.png"],
  ["woman-cook", "Woman cook", "Default/3D/woman_cook_3d_default.png"],
  ["man-scientist", "Man scientist", "Default/3D/man_scientist_3d_default.png"],
  ["woman-scientist", "Woman scientist", "Default/3D/woman_scientist_3d_default.png"],
  ["man-pilot", "Man pilot", "Default/3D/man_pilot_3d_default.png"],
  ["woman-pilot", "Woman pilot", "Default/3D/woman_pilot_3d_default.png"],
  ["man-student", "Man student", "Default/3D/man_student_3d_default.png"],
  ["woman-student", "Woman student", "Default/3D/woman_student_3d_default.png"],
  ["man-tuxedo", "Man in tuxedo", "Default/3D/man_in_tuxedo_3d_default.png"],
  ["crown", "Person with crown", "Default/3D/person_with_crown_3d_default.png"],
  ["cowboy", "Cowboy hat face", "3D/cowboy_hat_face_3d.png"],
  ["robot", "Robot", "3D/robot_3d.png"],
  ["alien", "Alien", "3D/alien_3d.png"],
  ["ghost", "Ghost", "3D/ghost_3d.png"],
  ["dragon", "Dragon", "3D/dragon_3d.png"],
];

export const AVATARS = RAW.map(([id, dir, file]) => ({
  id,
  url: `${BASE}/${encodeURIComponent(dir)}/${file}`,
}));

const MAP = new Map(AVATARS.map((a) => [a.id, a.url]));
export const avatarUrl = (id?: string | null) => (id ? MAP.get(id) : undefined);
