// Öğrenci (Student) Sidebar Menu
export const STUDENT_SIDEBAR_MENU = {
    workspace: {
      displayName: "Sınav Asistanım", // veya dinamik kullanıcı adı
      quickCreate: [
        { label: "Yeni Not", action: "create_note" },
        { label: "Kişisel Soru Seti", action: "create_question_set" },
        { label: "Çalışma Oturumu", action: "create_study_session" },
      ],
      notifications: true,
    },
    mainNav: [
      { label: "Panel", key: "dashboard" },
      { label: "Çalışma Planı", key: "study_plan" },
  
      { label: "Dersler", key: "courses_topics" },
      { label: "Egzersizler", key: "practice_assessment" },
      { label: "Performans", key: "performance_analytics" },
    ],
    resources: [
      { label: "İçerik Kütüphanesi", key: "content_library" },
      { label: "Kişisel Notlarım", key: "personal_notes" },
      { label: "Kaydedilenler", key: "saved_items" },
      { label: "Çalışma Gruplarım", key: "study_groups", optional: true },
      { label: "Daha Fazla...", key: "more" },
    ],
    tools: [
      { label: "Ayarlar", key: "settings" },
      { label: "Yardım ve Destek", key: "help" },
      { label: "Ara", key: "search" },
    ],
    profile: {
      avatar: true,
      name: true,
      email: true,
      moreOptions: true,
    },
  };
  
  // Yönetici (Admin) Sidebar Menu
  export const ADMIN_SIDEBAR_MENU = {
    workspace: {
      displayName: "Sınav Platformu Yönetimi", // veya dinamik yönetici adı
      quickAction: [
        { label: "Yeni İçerik Ekle", action: "add_content" },
        { label: "Duyuru Yayınla", action: "publish_announcement" },
        { label: "Kullanıcı Davet Et", action: "invite_user" },
      ],
      systemNotifications: true,
    },
    mainPanel: [
      { label: "Genel Bakış (Dashboard)", key: "dashboard" },
      { label: "Kullanıcı Yönetimi", key: "user_management" },
      { label: "İçerik Yönetimi", key: "content_management" },
      { label: "Sınav Yönetimi", key: "exam_management" },
    ],
    aiModules: [
      { label: "Yapay Zeka Co-Pilot Ayarları", key: "ai_copilot_settings" },
      { label: "Soru Üretim Modülü Denetimi", key: "question_generation" },
      { label: "Değerlendirme ve Geri Bildirim Ayarları", key: "assessment_feedback" },
      { label: "Kişiselleştirilmiş Çalışma Planı Algoritması", key: "personalized_study_plan" },
    ],
    analytics: [
      { label: "Öğrenci İlerleme Raporları", key: "student_reports" },
      { label: "İçerik Etkileşim Analizleri", key: "content_analytics" },
      { label: "Platform Kullanım İstatistikleri", key: "platform_stats" },
      { label: "Yapay Zeka Performans Metrikleri", key: "ai_performance" },
    ],
    community: [
      { label: "Oyunlaştırma Ayarları", key: "gamification", optional: true },
      { label: "Forum ve Grup Denetimi", key: "forum_group_moderation", optional: true },
      { label: "Duyurular ve Bildirimler", key: "announcements" },
    ],
    system: [
      { label: "Platform Ayarları", key: "platform_settings" },
      { label: "Yönetici Yardım ve Dokümantasyon", key: "admin_help" },
      { label: "Sistem Logları ve İzleme", key: "system_logs" },
      { label: "Karanlık Mod", key: "dark_mode" },
    ],
    profile: {
      avatar: true,
      name: true,
      email: true,
      moreOptions: true,
    },
  };
  
  export const LECTURES = [
    { id: "lec_kpss", name: "KPSS" },
    { id: "lec_isletme", name: "İşletme" },
    { id: "lec_iktisat", name: "İktisat" },
    { id: "lec_matematik", name: "Matematik" },
    { id: "lec_bilgisayar", name: "Bilgisayar Bilimleri" },
    // Example of a previously existing one, if you want to keep others, translate them similarly
    // { id: "lec_tarih", name: "Tarih" }, 
  ];
  
  // Subjects will be selectable from a list.
  // For now, this is a global list. It could be made dependent on lectures later.
  export const SUBJECTS = [
    // KPSS Subjects
    { id: "subj_kpss_gy", name: "Genel Yetenek", lectureId: "lec_kpss" },
    { id: "subj_kpss_gk", name: "Genel Kültür", lectureId: "lec_kpss" },
    { id: "subj_kpss_eb", name: "Eğitim Bilimleri", lectureId: "lec_kpss" },
    { id: "subj_kpss_hukuk", name: "Hukuk (KPSS)", lectureId: "lec_kpss" },
    { id: "subj_kpss_iktisat_alan", name: "İktisat (KPSS Alan)", lectureId: "lec_kpss" }, // Renamed to avoid conflict if "İktisat" is also a lecture
    { id: "subj_kpss_maliye", name: "Maliye (KPSS)", lectureId: "lec_kpss" },
    { id: "subj_kpss_muhasebe_alan", name: "Muhasebe (KPSS Alan)", lectureId: "lec_kpss" }, // Renamed for clarity
  
    // İşletme Subjects
    { id: "subj_isletme_pazarlama", name: "Pazarlama", lectureId: "lec_isletme" },
    { id: "subj_isletme_finans", name: "Finans", lectureId: "lec_isletme" },
    { id: "subj_isletme_yonetim", name: "Yönetim ve Organizasyon", lectureId: "lec_isletme" },
    { id: "subj_isletme_muhasebe", name: "Muhasebe", lectureId: "lec_isletme" },
    { id: "subj_isletme_insan_kaynaklari", name: "İnsan Kaynakları Yönetimi", lectureId: "lec_isletme" },
  
    // İktisat Subjects
    { id: "subj_iktisat_mikro", name: "Mikroekonomi", lectureId: "lec_iktisat" },
    { id: "subj_iktisat_makro", name: "Makroekonomi", lectureId: "lec_iktisat" },
    { id: "subj_iktisat_ekonometri", name: "Ekonometri", lectureId: "lec_iktisat" },
    { id: "subj_iktisat_turkiye_ekonomisi", name: "Türkiye Ekonomisi", lectureId: "lec_iktisat" },
    { id: "subj_iktisat_uluslararasi_iktisat", name: "Uluslararası İktisat", lectureId: "lec_iktisat" },
  
    // Matematik Subjects (Translated examples)
    { id: "subj_mat_cebir", name: "Cebir", lectureId: "lec_matematik" },
    { id: "subj_mat_geometri", name: "Geometri", lectureId: "lec_matematik" },
    { id: "subj_mat_lineercebir", name: "Lineer Cebir", lectureId: "lec_matematik" },
  
    // Bilgisayar Bilimleri Subjects (Translated examples)
    { id: "subj_cs_veri_yapilari", name: "Veri Yapıları", lectureId: "lec_bilgisayar" },
    { id: "subj_cs_algoritmalar", name: "Algoritmalar", lectureId: "lec_bilgisayar" },
    { id: "subj_cs_web_gelistirme", name: "Web Geliştirme", lectureId: "lec_bilgisayar" },
  ];
  
  export type Lecture = typeof LECTURES[number];
  export type Subject = typeof SUBJECTS[number]; // Added Subject type
  