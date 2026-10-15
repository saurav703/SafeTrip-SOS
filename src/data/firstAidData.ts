import { FirstAidGuide, SafeSpot } from '../types/safetrip';

export const OFFLINE_FIRST_AID_GUIDES: FirstAidGuide[] = [
  {
    id: 'heavy_bleeding',
    title: 'Severe Bleeding & Hemorrhage Control',
    category: 'trauma',
    urgency: 'critical',
    description: 'Protocol for arterial or profuse venous blood loss during transit or accident.',
    quickSummary: 'Apply direct, firm pressure with a clean cloth. Do not remove saturated layers. Elevate if no fracture.',
    steps: [
      {
        number: 1,
        title: 'Immediate Direct Pressure',
        detail: 'Place a clean pad, clothing, or bare hands directly over the wound. Push down hard with the heel of your palms.',
        warning: 'Do NOT press directly on embedded foreign objects (glass, metal).'
      },
      {
        number: 2,
        title: 'Maintain Constant Pressure',
        detail: 'Maintain uninterrupted pressure for at least 10 minutes without lifting the pad to inspect.',
      },
      {
        number: 3,
        title: 'Layer Without Removing',
        detail: 'If blood seeps through, place another cloth directly over the first. Never peel off the bottom cloth as it disrupts clotting.',
      },
      {
        number: 4,
        title: 'Emergency Tourniquet (Limbs Only)',
        detail: 'If blood is spurting from an arm or leg and pressure fails: bind a 2-3 inch wide strip 2 inches above the wound (between wound and heart). Tighten until bleeding stops. Record exact time applied.',
        warning: 'Never apply a tourniquet directly over a joint (elbow or knee) or around the neck.'
      }
    ],
    dos: [
      'Keep the injured person lying flat and still',
      'Keep them warm with a jacket to prevent hemorrhagic shock',
      'Note the exact time a tourniquet is applied'
    ],
    donts: [
      'Do not wash deep open wounds with high-pressure water',
      'Do not probe or remove impaled objects',
      'Do not release a tourniquet once secured until surgical staff arrives'
    ],
    offlineAvailable: true
  },
  {
    id: 'broken_bone',
    title: 'Fractures & Broken Leg Immobilization',
    category: 'trauma',
    urgency: 'high',
    description: 'Trekker, commuter, or accident injury with suspected bone fracture or joint dislocation.',
    quickSummary: 'Immobilize in found position. Support above and below the joint. Never attempt to realign the bone.',
    steps: [
      {
        number: 1,
        title: 'Do Not Realign Bone',
        detail: 'Keep the limb in the exact posture you found it. Attempting to straighten causes severe nerve and blood vessel lacerations.',
      },
      {
        number: 2,
        title: 'Improvise an In-transit Splint',
        detail: 'Use rolled magazines, trekking poles, tree branches, or umbrella struts padded with clothing on both sides of the fractured limb.',
      },
      {
        number: 3,
        title: 'Secure Joints Above and Below',
        detail: 'Tie bandages, straps, or shoe laces firmly above and below the break. Snug enough to prevent movement, but loose enough for finger/toe circulation.',
        warning: 'Check toes/fingers every 10 min: if they turn blue or cold, loosen ties immediately.'
      },
      {
        number: 4,
        title: 'Ice & Elevation If Safe',
        detail: 'Apply a cold pack or chilled bottle wrapped in cloth for 15 min intervals to reduce swelling. Only elevate if doing so does not cause sharp pain.',
      }
    ],
    dos: [
      'Check circulation (pulse or capillary nail refill) past the fracture',
      'Support the injured limb with soft padding',
      'Keep patient calm and stationary'
    ],
    donts: [
      'Never force an open protruding bone back into the skin',
      'Do not allow the patient to walk or bear weight on a suspected leg fracture',
      'Do not massage the injured area'
    ],
    offlineAvailable: true
  },
  {
    id: 'snakebite',
    title: 'Snakebite & Venomous Envenomation',
    category: 'outdoor',
    urgency: 'critical',
    description: 'Vital protocol for trekkers, rural commuters, and outdoor travelers.',
    quickSummary: 'Keep limb immobile below heart level. Apply firm pressure immobilization bandage. Never cut or suck venom.',
    steps: [
      {
        number: 1,
        title: 'Absolute Immobility',
        detail: 'Have the victim sit or lie completely still. Any movement or walking accelerates lymphatic venom absorption into the bloodstream.',
        warning: 'Keep the bitten limb strictly at or below heart level.'
      },
      {
        number: 2,
        title: 'Remove Constricting Items Immediately',
        detail: 'Quickly remove rings, watches, bracelets, and tight shoes before severe swelling begins.',
      },
      {
        number: 3,
        title: 'Pressure Immobilization Bandage (PIB)',
        detail: 'Wrap an elastic crepe bandage firmly over the bite, then spiral up the entire limb toward the torso (firm like wrapping a sprained ankle). Splint to prevent joint bending.',
      },
      {
        number: 4,
        title: 'Trace Swelling Boundary & Time',
        detail: 'Use a pen to draw a circle around the bite and mark the edge of the swelling with the current timestamp every 15 minutes for ER doctors.',
      }
    ],
    dos: [
      'Take a photo of the snake from safe distance (do NOT chase or handle it)',
      'Keep victim reassured and breathing slowly',
      'Transport via stretcher or carry if possible'
    ],
    donts: [
      'DO NOT cut the wound or try to suck out venom',
      'DO NOT apply ice, electricity, or chemical pastes',
      'DO NOT apply a tight arterial tourniquet that cuts off blood flow',
      'DO NOT give caffeine, alcohol, or aspirin'
    ],
    offlineAvailable: true
  },
  {
    id: 'panic_attack',
    title: 'Panic Attack & Acute Travel Distress',
    category: 'panic',
    urgency: 'moderate',
    description: 'For feeling trapped in a cab, stranded alone, hyperventilating, or experiencing overwhelming fear.',
    quickSummary: 'Box breathing 4-4-4-4, 5-4-3-2-1 grounding technique, and posture resetting.',
    steps: [
      {
        number: 1,
        title: 'Box Breathing Sequence',
        detail: 'Inhale deeply through your nose for 4 seconds. Hold gently for 4 seconds. Exhale slowly through mouth for 4 seconds. Hold empty for 4 seconds. Repeat 6 cycles.',
      },
      {
        number: 2,
        title: 'Tactile Grounding (5-4-3-2-1)',
        detail: 'Notice 5 things you can see around you; 4 textures you can touch; 3 sounds you can hear; 2 things you can smell; 1 physical sensation.',
      },
      {
        number: 3,
        title: 'Feet Flat on Floor & Cold Touch',
        detail: 'Place both soles firmly flat on the car or pavement floor. Touch cold glass or splash cold water on your wrists to trigger vagus nerve recovery.',
      }
    ],
    dos: [
      'Remind yourself: this physical rush is adrenaline, it will peak and fade in 10-15 minutes',
      'Loosen any tight collar or scarves',
      'Tap your SafeTrip SOS check-in to keep trusted contacts updated silently'
    ],
    donts: [
      'Do not breathe rapidly into a paper bag (risk of hypoxia)',
      'Do not fight the sensation; observe it pass like a wave'
    ],
    offlineAvailable: true
  },
  {
    id: 'cpr_unconscious',
    title: 'Adult CPR & Unresponsive Casualty',
    category: 'medical',
    urgency: 'critical',
    description: 'Steps when a co-traveler, driver, or pedestrian collapses and is unresponsive without normal breathing.',
    quickSummary: 'Check response, call 112/911, start hard & fast chest compressions in center of chest at 100-120 bpm.',
    steps: [
      {
        number: 1,
        title: 'Check Responsiveness & Breathing',
        detail: 'Tap shoulders loudly: "Can you hear me?". Look at chest for normal breathing for 5-10 seconds. Agonal gasps are NOT breathing.',
      },
      {
        number: 2,
        title: 'Position in Center of Chest',
        detail: 'Place the heel of one hand on center of victim’s breastbone (between nipples). Interlock your other hand on top. Keep elbows straight.',
      },
      {
        number: 3,
        title: 'Compress Hard and Fast',
        detail: 'Push down at least 2 inches (5 cm) at a rate of 100-120 beats per minute (to the rhythm of "Stayin’ Alive"). Allow full chest recoil between compressions.',
        warning: 'Do not interrupt compressions for more than 10 seconds.'
      }
    ],
    dos: [
      'Push hard and fast; tiring after 2 minutes is normal—switch rescuers if someone is with you',
      'Ensure the victim is on a hard, flat surface',
      'Turn on phone speakerphone for emergency dispatcher advice'
    ],
    donts: [
      'Do not stop until medical professionals take over or person moves',
      'Do not give rescue breaths if you are untrained—hands-only CPR is highly effective'
    ],
    offlineAvailable: true
  },
  {
    id: 'heatstroke',
    title: 'Heat Exhaustion & Severe Heatstroke',
    category: 'outdoor',
    urgency: 'high',
    description: 'Dehydration and heat collapse during summer commutes or open-sun trekking.',
    quickSummary: 'Rapid cooling is vital: move to shade, strip excess clothes, mist with water, apply cold packs to neck/armpits/groin.',
    steps: [
      {
        number: 1,
        title: 'Identify Warning Signs',
        detail: 'Hot, flushed skin, cessation of sweating, confusion, slurred speech, or dizziness indicates medical emergency heatstroke.',
      },
      {
        number: 2,
        title: 'Immediate Active Cooling',
        detail: 'Move immediately into air conditioning or deepest shade. Remove outer clothing layers.',
      },
      {
        number: 3,
        title: 'Target Great Vessels',
        detail: 'Place cold water bottles, wet cloths, or ice packs directly against neck, armpits, and groin where major blood vessels circulate near the skin.',
      }
    ],
    dos: [
      'Fan vigorously while misting skin with water',
      'Offer small sips of cool water ONLY if conscious and alert'
    ],
    donts: [
      'Never give fluids to a drowsy, disoriented, or vomiting person',
      'Do not plunge into freezing ice bath if elderly or cardiovascular risk'
    ],
    offlineAvailable: true
  }
];

export const MOCK_SAFE_SPOTS: SafeSpot[] = [
  {
    id: 'spot-pol-1',
    name: 'Metropolitan Central Police Station (Zone 4)',
    category: 'police',
    lat: 37.7765,
    lng: -122.4178,
    distanceMeters: 480,
    address: '420 7th St, Civic Center',
    phone: '112 / +1-555-0192',
    is24x7: true,
    walkingMinutes: 6,
    drivingMinutes: 2
  },
  {
    id: 'spot-hosp-1',
    name: 'City General Hospital & Emergency Trauma Center',
    category: 'hospital',
    lat: 37.7802,
    lng: -122.4124,
    distanceMeters: 850,
    address: '890 Market St, Health District',
    phone: '+1-555-0911',
    is24x7: true,
    walkingMinutes: 11,
    drivingMinutes: 4
  },
  {
    id: 'spot-pharm-1',
    name: 'CareLine 24-Hour Pharmacy & WellCare Safe Haven',
    category: 'pharmacy',
    lat: 37.7731,
    lng: -122.4210,
    distanceMeters: 320,
    address: '215 Mission Blvd, illuminated safe lobby',
    phone: '+1-555-0842',
    is24x7: true,
    walkingMinutes: 4,
    drivingMinutes: 1
  },
  {
    id: 'spot-haven-1',
    name: 'Transit Hub 24/7 Security Booth & Public Kiosk',
    category: 'safe_haven',
    lat: 37.7788,
    lng: -122.4150,
    distanceMeters: 550,
    address: 'Central Concourse Level 1, Near Gate B',
    phone: '+1-555-0377',
    is24x7: true,
    walkingMinutes: 7,
    drivingMinutes: 3
  },
  {
    id: 'spot-cctv-1',
    name: 'MetroFuel 24/7 Express & High-Res CCTV Forecourt',
    category: 'fuel_cctv',
    lat: 37.7695,
    lng: -122.4255,
    distanceMeters: 920,
    address: '1044 South Van Ness Ave',
    phone: '+1-555-0720',
    is24x7: true,
    walkingMinutes: 12,
    drivingMinutes: 3
  }
];
