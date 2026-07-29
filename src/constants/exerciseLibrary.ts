export interface Exercise {
  id: string;
  name: string;
  equipment?: string;
  description?: string;
}

export interface MuscleRegion {
  id: string;
  categoryId: string;
  name: string;
  subtitle: string;
  icon?: string;
  exercises: Exercise[];
}

export interface CategoryExerciseLibrary {
  categoryId: string;
  categoryTitle: string;
  regions: MuscleRegion[];
}

export const EXERCISE_LIBRARY: Record<string, MuscleRegion[]> = {
  chest: [
    {
      id: 'upper_chest',
      categoryId: 'chest',
      name: 'Upper Chest',
      subtitle: 'Focus on clavicular head growth & upper chest thickness.',
      icon: '💪',
      exercises: [
        { id: 'inc_db_press', name: 'Incline Dumbbell Press', equipment: 'Dumbbells' },
        { id: 'inc_bb_press', name: 'Incline Barbell Press', equipment: 'Barbell' },
        { id: 'inc_smith_press', name: 'Incline Smith Machine Press', equipment: 'Smith Machine' },
        { id: 'inc_cable_fly', name: 'Incline Cable Fly', equipment: 'Cables' },
        { id: 'inc_mach_press', name: 'Incline Machine Press', equipment: 'Machine' },
        { id: 'inc_chest_press_mach', name: 'Incline Chest Press Machine', equipment: 'Machine' },
      ],
    },
    {
      id: 'middle_chest',
      categoryId: 'chest',
      name: 'Middle Chest',
      subtitle: 'Target overall sternal chest size and pushing power.',
      icon: '💪',
      exercises: [
        { id: 'flat_bb_press', name: 'Flat Barbell Bench Press', equipment: 'Barbell' },
        { id: 'flat_db_press', name: 'Flat Dumbbell Bench Press', equipment: 'Dumbbells' },
        { id: 'mach_chest_press', name: 'Machine Chest Press', equipment: 'Machine' },
        { id: 'pec_deck_fly', name: 'Pec Deck Fly', equipment: 'Machine' },
        { id: 'flat_cable_fly', name: 'Flat Cable Fly', equipment: 'Cables' },
        { id: 'pushups', name: 'Push-ups', equipment: 'Bodyweight' },
      ],
    },
    {
      id: 'lower_chest',
      categoryId: 'chest',
      name: 'Lower Chest',
      subtitle: 'Develop lower pectoral definition and lower chest line.',
      icon: '💪',
      exercises: [
        { id: 'dec_bb_press', name: 'Decline Barbell Bench Press', equipment: 'Barbell' },
        { id: 'dec_db_press', name: 'Decline Dumbbell Bench Press', equipment: 'Dumbbells' },
        { id: 'dec_smith_press', name: 'Decline Smith Machine Press', equipment: 'Smith Machine' },
        { id: 'low_cable_fly', name: 'Low Cable Fly', equipment: 'Cables' },
        { id: 'chest_dips', name: 'Chest Dips', equipment: 'Bodyweight' },
        { id: 'dec_chest_press_mach', name: 'Decline Chest Press Machine', equipment: 'Machine' },
      ],
    },
  ],

  back: [
    {
      id: 'lats',
      categoryId: 'back',
      name: 'Lats',
      subtitle: 'Build lat width and a powerful V-taper frame.',
      icon: '🏋️',
      exercises: [
        { id: 'lat_pull_wide', name: 'Lat Pulldown (Wide Grip)', equipment: 'Cable Machine' },
        { id: 'lat_pull_close', name: 'Lat Pulldown (Close Grip)', equipment: 'Cable Machine' },
        { id: 'pullup', name: 'Pull-up', equipment: 'Bodyweight' },
        { id: 'assisted_pullup', name: 'Assisted Pull-up', equipment: 'Machine' },
        { id: 'straight_arm_pulldown', name: 'Straight Arm Pulldown', equipment: 'Cables' },
      ],
    },
    {
      id: 'middle_back',
      categoryId: 'back',
      name: 'Middle Back',
      subtitle: 'Density, rhomboid strength, and mid-back thickness.',
      icon: '🏋️',
      exercises: [
        { id: 'seated_cable_row', name: 'Seated Cable Row', equipment: 'Cables' },
        { id: 'barbell_row', name: 'Barbell Row', equipment: 'Barbell' },
        { id: 'tbar_row', name: 'T-Bar Row', equipment: 'T-Bar' },
        { id: 'db_row', name: 'Dumbbell Row', equipment: 'Dumbbells' },
        { id: 'mach_row', name: 'Machine Row', equipment: 'Machine' },
        { id: 'chest_sup_row', name: 'Chest Supported Row', equipment: 'Machine / Bench' },
      ],
    },
    {
      id: 'lower_back',
      categoryId: 'back',
      name: 'Lower Back',
      subtitle: 'Erector spinae endurance, lumbar stability, and strength.',
      icon: '🏋️',
      exercises: [
        { id: 'back_ext', name: 'Back Extension', equipment: 'Hyperextension Bench' },
        { id: 'rdl', name: 'Romanian Deadlift', equipment: 'Barbell / Dumbbells' },
        { id: 'rack_pull', name: 'Rack Pull', equipment: 'Barbell' },
        { id: 'good_morning', name: 'Good Morning', equipment: 'Barbell' },
      ],
    },
  ],

  legs: [
    {
      id: 'quadriceps',
      categoryId: 'legs',
      name: 'Quadriceps',
      subtitle: 'Front thigh development, quad sweep, and knee stability.',
      icon: '🦵',
      exercises: [
        { id: 'squat', name: 'Squat', equipment: 'Barbell' },
        { id: 'front_squat', name: 'Front Squat', equipment: 'Barbell' },
        { id: 'leg_press', name: 'Leg Press', equipment: 'Machine' },
        { id: 'leg_extension', name: 'Leg Extension', equipment: 'Machine' },
        { id: 'walking_lunges', name: 'Walking Lunges', equipment: 'Dumbbells / Bodyweight' },
        { id: 'bulgarian_split_squat', name: 'Bulgarian Split Squat', equipment: 'Dumbbells' },
        { id: 'hack_squat', name: 'Hack Squat', equipment: 'Machine' },
      ],
    },
    {
      id: 'hamstrings',
      categoryId: 'legs',
      name: 'Hamstrings',
      subtitle: 'Posterior chain strength and hamstring flexibility.',
      icon: '🦵',
      exercises: [
        { id: 'leg_curl', name: 'Leg Curl', equipment: 'Machine' },
        { id: 'hamstring_rdl', name: 'Romanian Deadlift', equipment: 'Barbell / Dumbbells' },
        { id: 'seated_leg_curl', name: 'Seated Leg Curl', equipment: 'Machine' },
        { id: 'nordic_curl', name: 'Nordic Curl', equipment: 'Bodyweight' },
        { id: 'glute_ham_raise', name: 'Glute Ham Raise', equipment: 'GHR Bench' },
      ],
    },
    {
      id: 'glutes',
      categoryId: 'legs',
      name: 'Glutes',
      subtitle: 'Gluteus maximus power, hip extension, and athletic drive.',
      icon: '🦵',
      exercises: [
        { id: 'hip_thrust', name: 'Hip Thrust', equipment: 'Barbell / Bench' },
        { id: 'glute_bridge', name: 'Glute Bridge', equipment: 'Bodyweight / Dumbbell' },
        { id: 'cable_kickback', name: 'Cable Kickback', equipment: 'Cables' },
        { id: 'sumo_squat', name: 'Sumo Squat', equipment: 'Barbell / Dumbbell' },
      ],
    },
    {
      id: 'calves',
      categoryId: 'legs',
      name: 'Calves',
      subtitle: 'Gastrocnemius and soleus lower leg hypertrophy.',
      icon: '🦵',
      exercises: [
        { id: 'standing_calf_raise', name: 'Standing Calf Raise', equipment: 'Machine' },
        { id: 'seated_calf_raise', name: 'Seated Calf Raise', equipment: 'Machine' },
        { id: 'donkey_calf_raise', name: 'Donkey Calf Raise', equipment: 'Machine / Bodyweight' },
        { id: 'leg_press_calf_raise', name: 'Leg Press Calf Raise', equipment: 'Machine' },
      ],
    },
  ],

  shoulders: [
    {
      id: 'front_delts',
      categoryId: 'shoulders',
      name: 'Front Delts',
      subtitle: 'Anterior deltoid isolation and overhead pushing assist.',
      icon: '💪',
      exercises: [
        { id: 'front_raise', name: 'Front Raise', equipment: 'Dumbbells' },
        { id: 'plate_front_raise', name: 'Plate Front Raise', equipment: 'Weight Plate' },
        { id: 'barbell_front_raise', name: 'Barbell Front Raise', equipment: 'Barbell' },
      ],
    },
    {
      id: 'side_delts',
      categoryId: 'shoulders',
      name: 'Side Delts',
      subtitle: 'Lateral deltoid cap width and 3D shoulder width.',
      icon: '💪',
      exercises: [
        { id: 'db_lateral_raise', name: 'Dumbbell Lateral Raise', equipment: 'Dumbbells' },
        { id: 'cable_lateral_raise', name: 'Cable Lateral Raise', equipment: 'Cables' },
        { id: 'mach_lateral_raise', name: 'Machine Lateral Raise', equipment: 'Machine' },
        { id: 'leaning_lateral_raise', name: 'Leaning Lateral Raise', equipment: 'Dumbbell' },
      ],
    },
    {
      id: 'rear_delts',
      categoryId: 'shoulders',
      name: 'Rear Delts',
      subtitle: 'Posterior deltoid health, shoulder posture, and stability.',
      icon: '💪',
      exercises: [
        { id: 'face_pull', name: 'Face Pull', equipment: 'Cable Rope' },
        { id: 'reverse_pec_deck', name: 'Reverse Pec Deck', equipment: 'Machine' },
        { id: 'rear_delt_fly', name: 'Rear Delt Fly', equipment: 'Dumbbells' },
        { id: 'bent_over_rev_fly', name: 'Bent Over Reverse Fly', equipment: 'Dumbbells' },
      ],
    },
    {
      id: 'compound_shoulders',
      categoryId: 'shoulders',
      name: 'Compound Pressing',
      subtitle: 'Heavy vertical pressing for full shoulder girdle strength.',
      icon: '💪',
      exercises: [
        { id: 'ohp', name: 'Overhead Press', equipment: 'Barbell' },
        { id: 'arnold_press', name: 'Arnold Press', equipment: 'Dumbbells' },
        { id: 'db_shoulder_press', name: 'Dumbbell Shoulder Press', equipment: 'Dumbbells' },
        { id: 'smith_shoulder_press', name: 'Smith Machine Shoulder Press', equipment: 'Smith Machine' },
        { id: 'mach_shoulder_press', name: 'Machine Shoulder Press', equipment: 'Machine' },
      ],
    },
  ],

  arms: [
    {
      id: 'biceps',
      categoryId: 'arms',
      name: 'Biceps',
      subtitle: 'Brachialis & biceps brachii peak and flex power.',
      icon: '💪',
      exercises: [
        { id: 'barbell_curl', name: 'Barbell Curl', equipment: 'Barbell' },
        { id: 'ez_bar_curl', name: 'EZ Bar Curl', equipment: 'EZ Bar' },
        { id: 'dumbbell_curl', name: 'Dumbbell Curl', equipment: 'Dumbbells' },
        { id: 'hammer_curl', name: 'Hammer Curl', equipment: 'Dumbbells' },
        { id: 'concentration_curl', name: 'Concentration Curl', equipment: 'Dumbbell' },
        { id: 'preacher_curl', name: 'Preacher Curl', equipment: 'EZ Bar / Bench' },
        { id: 'cable_curl', name: 'Cable Curl', equipment: 'Cables' },
        { id: 'incline_db_curl', name: 'Incline Dumbbell Curl', equipment: 'Dumbbells' },
      ],
    },
    {
      id: 'triceps',
      categoryId: 'arms',
      name: 'Triceps',
      subtitle: 'Lateral, medial, and long head tricep extension strength.',
      icon: '💪',
      exercises: [
        { id: 'rope_pushdown', name: 'Rope Pushdown', equipment: 'Cables' },
        { id: 'straight_bar_pushdown', name: 'Straight Bar Pushdown', equipment: 'Cables' },
        { id: 'skull_crushers', name: 'Skull Crushers', equipment: 'EZ Bar' },
        { id: 'overhead_db_ext', name: 'Overhead Dumbbell Extension', equipment: 'Dumbbell' },
        { id: 'overhead_cable_ext', name: 'Overhead Cable Extension', equipment: 'Cables' },
        { id: 'close_grip_bench', name: 'Close Grip Bench Press', equipment: 'Barbell' },
        { id: 'tricep_dips', name: 'Tricep Dips', equipment: 'Bodyweight / Parallel Bars' },
        { id: 'tricep_kickbacks', name: 'Kickbacks', equipment: 'Dumbbells' },
      ],
    },
    {
      id: 'forearms',
      categoryId: 'arms',
      name: 'Forearms',
      subtitle: 'Grip strength, wrist flexors, and forearm vascularity.',
      icon: '💪',
      exercises: [
        { id: 'wrist_curl', name: 'Wrist Curl', equipment: 'Barbell / Dumbbells' },
        { id: 'reverse_wrist_curl', name: 'Reverse Wrist Curl', equipment: 'Barbell / Dumbbells' },
        { id: 'reverse_curl', name: 'Reverse Curl', equipment: 'EZ Bar' },
        { id: 'farmers_carry', name: 'Farmer\'s Carry', equipment: 'Heavy Dumbbells / Trap Bar' },
      ],
    },
  ],

  core: [
    {
      id: 'upper_abs',
      categoryId: 'core',
      name: 'Upper Abs',
      subtitle: 'Upper rectus abdominis crunching and flexion.',
      icon: '🧘',
      exercises: [
        { id: 'crunch', name: 'Crunch', equipment: 'Bodyweight' },
        { id: 'cable_crunch', name: 'Cable Crunch', equipment: 'Cables' },
        { id: 'machine_crunch', name: 'Machine Crunch', equipment: 'Machine' },
      ],
    },
    {
      id: 'lower_abs',
      categoryId: 'core',
      name: 'Lower Abs',
      subtitle: 'Pelvic tilts and lower abdominal leg lift isolation.',
      icon: '🧘',
      exercises: [
        { id: 'leg_raise', name: 'Leg Raise', equipment: 'Mat / Bodyweight' },
        { id: 'hanging_leg_raise', name: 'Hanging Leg Raise', equipment: 'Pull-up Bar' },
        { id: 'reverse_crunch', name: 'Reverse Crunch', equipment: 'Bodyweight' },
      ],
    },
    {
      id: 'obliques',
      categoryId: 'core',
      name: 'Obliques',
      subtitle: 'Rotational core power and waist side stability.',
      icon: '🧘',
      exercises: [
        { id: 'russian_twist', name: 'Russian Twist', equipment: 'Bodyweight / Plate' },
        { id: 'wood_chop', name: 'Wood Chop', equipment: 'Cables / Dumbbell' },
        { id: 'side_plank', name: 'Side Plank', equipment: 'Bodyweight' },
        { id: 'bicycle_crunch', name: 'Bicycle Crunch', equipment: 'Bodyweight' },
      ],
    },
    {
      id: 'core_stability',
      categoryId: 'core',
      name: 'Core Stability',
      subtitle: 'Anti-extension and anti-rotation functional bracing.',
      icon: '🧘',
      exercises: [
        { id: 'plank', name: 'Plank', equipment: 'Bodyweight' },
        { id: 'dead_bug', name: 'Dead Bug', equipment: 'Bodyweight' },
        { id: 'bird_dog', name: 'Bird Dog', equipment: 'Bodyweight' },
        { id: 'ab_wheel_rollout', name: 'Ab Wheel Rollout', equipment: 'Ab Wheel' },
      ],
    },
  ],

  cardio: [
    {
      id: 'cardio_all',
      categoryId: 'cardio',
      name: 'Cardio Workouts',
      subtitle: 'Aerobic condition, endurance, and cardiovascular health.',
      icon: '❤️',
      exercises: [
        { id: 'walking', name: 'Walking', equipment: 'Outdoors / Treadmill' },
        { id: 'running', name: 'Running', equipment: 'Outdoors / Track' },
        { id: 'treadmill', name: 'Treadmill', equipment: 'Machine' },
        { id: 'cycling', name: 'Cycling', equipment: 'Stationary Bike / Road' },
        { id: 'stair_climber', name: 'Stair Climber', equipment: 'Machine' },
        { id: 'rowing_machine', name: 'Rowing Machine', equipment: 'Rower' },
        { id: 'elliptical', name: 'Elliptical', equipment: 'Machine' },
        { id: 'jump_rope', name: 'Jump Rope', equipment: 'Jump Rope' },
        { id: 'swimming', name: 'Swimming', equipment: 'Pool' },
      ],
    },
  ],

  full_body: [
    {
      id: 'full_body_all',
      categoryId: 'full_body',
      name: 'Full Body Movement',
      subtitle: 'Multi-joint compound conditioning and athletic strength.',
      icon: '🔥',
      exercises: [
        { id: 'deadlift', name: 'Deadlift', equipment: 'Barbell' },
        { id: 'clean_and_press', name: 'Clean and Press', equipment: 'Barbell' },
        { id: 'thrusters', name: 'Thrusters', equipment: 'Barbell / Dumbbells' },
        { id: 'burpees', name: 'Burpees', equipment: 'Bodyweight' },
        { id: 'kettlebell_swing', name: 'Kettlebell Swing', equipment: 'Kettlebell' },
        { id: 'battle_rope', name: 'Battle Rope', equipment: 'Ropes' },
        { id: 'turkish_get_up', name: 'Turkish Get Up', equipment: 'Kettlebell / Dumbbell' },
      ],
    },
  ],
};
