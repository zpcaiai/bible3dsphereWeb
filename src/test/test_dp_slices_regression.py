import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


class TestWebDpSlicesRegression(unittest.TestCase):
    def test_slice_1_bible_atlas_graph_panel_wired(self):
        atlas = (ROOT / "src/features/bible-map/BibleAtlasPage.tsx").read_text(encoding="utf-8")
        switcher = (ROOT / "src/features/bible-map/components/LayerSwitcher.tsx").read_text(encoding="utf-8")
        test_file = (ROOT / "src/test/BibleAtlasGraphSlice.test.tsx").read_text(encoding="utf-8")
        self.assertIn("import { GraphPanel } from './components/GraphPanel'", atlas)
        self.assertIn("data-testid=\"bible-atlas-graph-btn\"", atlas)
        self.assertIn("view === 'graph'", atlas)
        self.assertIn("import { cn } from '../../../lib/utils'", switcher)
        self.assertIn("bible-atlas-graph-btn", test_file)

    def test_slice_2_jerusalem_sandbox_multi_era_temples(self):
        sandbox = (ROOT / "src/JerusalemSandbox.jsx").read_text(encoding="utf-8")
        test_file = (ROOT / "src/test/JerusalemSandboxMultiTemple.test.jsx").read_text(encoding="utf-8")
        self.assertIn("export const TEMPLE_VARIANTS = [", sandbox)
        self.assertIn("from './data/templeStructureTabernacle'", sandbox)
        self.assertIn("from './data/templeStructureZerubbabel'", sandbox)
        self.assertIn("from './data/templeStructureHerod'", sandbox)
        self.assertIn("data-testid=\"jeru-temple-selector\"", sandbox)
        self.assertIn("jeru-temple-variant-herod", test_file)

    def test_slice_3_realtime_minutes_and_voicemail_wired(self):
        rt_root = (ROOT / "src/realtime/RealtimeRoot.jsx").read_text(encoding="utf-8")
        voice_page = (ROOT / "src/VoiceRoomPage.jsx").read_text(encoding="utf-8")
        test_file = (ROOT / "src/test/RealtimeMinutesVoicemail.test.jsx").read_text(encoding="utf-8")
        self.assertIn("import MinutesModal from './MinutesModal'", rt_root)
        self.assertIn("import VoicemailModal from './VoicemailModal'", rt_root)
        self.assertIn("msg?.type === 'call_decline'", rt_root)
        self.assertIn("data-testid=\"voice-room-minutes-btn\"", voice_page)
        self.assertIn("call_decline", test_file)

    def test_slice_4_hymn_player_melody_synced_timings(self):
        hymn = (ROOT / "src/HymnPlayer.jsx").read_text(encoding="utf-8")
        test_file = (ROOT / "src/test/HymnPlayerTimings.test.jsx").read_text(encoding="utf-8")
        self.assertIn("import HYMN_TIMINGS from './hymnTimings'", hymn)
        self.assertIn("export function buildKaraokeTimeline(hymn)", hymn)
        self.assertIn("export function computeKaraokeState(hymn, cur, dur, playing)", hymn)
        self.assertIn("data-testid=\"hymn-timing-badge\"", hymn)
        self.assertIn("computeKaraokeState", test_file)

    def test_slice_5_mission_console_b1_governance_panels(self):
        console = (ROOT / "src/features/mission-os/console/MissionConsole.jsx").read_text(encoding="utf-8")
        test_file = (ROOT / "src/test/MissionConsoleGovernance.test.jsx").read_text(encoding="utf-8")
        for key in ("'organization'", "'features'", "'incidents'", "'audit'", "'outbox'"):
            self.assertIn(key, console)
        self.assertIn("MissionOutboxConsole", console)
        self.assertIn("mission.gate.evaluated", test_file)

    def test_slice_6_bible_reading_offline_pack_and_app_routes(self):
        reading = (ROOT / "src/BibleReadingPage.jsx").read_text(encoding="utf-8")
        app = (ROOT / "src/App.jsx").read_text(encoding="utf-8")
        test_file = (ROOT / "src/test/BibleReadingOfflineAndAppRoutes.test.jsx").read_text(encoding="utf-8")
        self.assertIn("from './lib/offlinePack'", reading)
        self.assertIn("data-testid=\"bible-offline-pack-badge\"", reading)
        self.assertIn("data-testid=\"bible-offline-pack-count\"", reading)
        for page in ("SharedPrayerPage", "GroupHubPage", "CareDashboardPage", "OnboardingPage"):
            self.assertIn(page, app)
        self.assertIn("onOpenVoice={() => setActivePanel('voice')}", app)
        self.assertIn("bible-offline-pack-badge", test_file)

    def test_slice_7_shared_prayer_api_exports(self):
        api_src = (ROOT / "src/api.js").read_text(encoding="utf-8")
        test_file = (ROOT / "src/test/SharedPrayerApiSlice.test.jsx").read_text(encoding="utf-8")
        self.assertIn("export async function fetchSharedPrayer(shareToken)", api_src)
        self.assertIn("export async function amenSharedPrayer(shareToken)", api_src)
        self.assertIn("/prayers/shared/tok-pray-88", test_file)

    def test_slice_8_growth_curve_and_formation_history_wired(self):
        growth_map = (ROOT / "src/GrowthMapPage.jsx").read_text(encoding="utf-8")
        test_file = (ROOT / "src/test/GrowthCurveAndHistorySlice.test.jsx").read_text(encoding="utf-8")
        self.assertIn("import GrowthCurve from './components/GrowthCurve'", growth_map)
        self.assertIn("import FormationHistory from './components/FormationHistory'", growth_map)
        self.assertIn("data-testid=\"growth-map-curve-view\"", growth_map)
        self.assertIn("data-testid=\"growth-map-history-view\"", growth_map)
        self.assertIn("growth-map-tab-curve", test_file)

    def test_slice_9_10_bible_atlas_person_journeys_wired(self):
        types_src = (ROOT / "src/features/bible-map/domain/types.ts").read_text(encoding="utf-8")
        constants_src = (ROOT / "src/features/bible-map/domain/constants.ts").read_text(encoding="utf-8")
        data_source_src = (ROOT / "src/features/bible-map/lib/dataSource.ts").read_text(encoding="utf-8")
        client_src = (ROOT / "src/features/bible-map/components/BibleMapClient.tsx").read_text(encoding="utf-8")
        detail_src = (ROOT / "src/features/bible-map/components/DetailPanel.tsx").read_text(encoding="utf-8")
        test_file = (ROOT / "src/test/BibleAtlasPeopleSlice.test.tsx").read_text(encoding="utf-8")
        self.assertIn("export interface BiblePersonJourneyDTO", types_src)
        self.assertIn("{ id: 'people', label: '人物足迹' }", constants_src)
        self.assertIn("export async function fetchPeople()", data_source_src)
        self.assertIn("data-testid=\"bible-map-people-list\"", client_src)
        self.assertIn("data-testid=\"bible-map-person-detail\"", detail_src)
        self.assertIn("bible-map-person-abraham", test_file)

    def test_slice_11_temple_sandbox_gltf_layer_and_translate_api(self):
        temple_src = (ROOT / "src/features/bible-map/components/TempleSandbox.tsx").read_text(encoding="utf-8")
        api_src = (ROOT / "src/api.js").read_text(encoding="utf-8")
        test_file = (ROOT / "src/test/TempleGltfAndTranslateApiSlice.test.tsx").read_text(encoding="utf-8")
        self.assertIn("import { createModelLayer } from '../../../lib/gltfModelLayer'", temple_src)
        self.assertIn("data-testid=\"temple-gltf-toggle\"", temple_src)
        self.assertIn("export async function translateText(text, targetLang = 'en')", api_src)
        self.assertIn("temple-gltf-active-badge", test_file)

    def test_slice_12_i18n_subpages_and_fetch_milestones_shape(self):
        i18n_src = (ROOT / "src/i18n/translations.js").read_text(encoding="utf-8")
        api_src = (ROOT / "src/api.js").read_text(encoding="utf-8")
        curve_src = (ROOT / "src/components/GrowthCurve.jsx").read_text(encoding="utf-8")
        self.assertIn("'📦 离线包已缓存': '📦 Offline pack cached'", i18n_src)
        self.assertIn("if (Array.isArray(data)) return data", api_src)
        self.assertIn("const list = Array.isArray(d) ? d : (d?.milestones || d?.items || [])", curve_src)

    def test_slice_13_sermon_asi_crash_and_engineering_scores(self):
        sermon_src = (ROOT / "src/SermonJournalPage.jsx").read_text(encoding="utf-8")
        eng_src = (ROOT / "src/EngineeringPage.jsx").read_text(encoding="utf-8")
        test_file = (ROOT / "src/test/SermonAndEngineeringBugfixSlice.test.jsx").read_text(encoding="utf-8")
        self.assertIn("console.error('Failed to create journal:', e);", sermon_src)
        self.assertIn("setSaveStatus('');", sermon_src)
        self.assertIn('data-testid="sermon-journal-total"', sermon_src)
        self.assertIn("/sfds/v3/formation/profile/", eng_src)
        self.assertIn("const resolvedScore = typeof scores?.[key] === 'number' ? scores[key] : defaultScore", eng_src)
        self.assertIn("sermon-journal-total", test_file)

    def test_slice_14_devotion_single_export_and_disciple_end_rel(self):
        devotion_src = (ROOT / "src/DevotionJournalPage.jsx").read_text(encoding="utf-8")
        disciple_src = (ROOT / "src/DiscipleFormationView.jsx").read_text(encoding="utf-8")
        test_file = (ROOT / "src/test/DevotionAndDiscipleBugfixSlice.test.jsx").read_text(encoding="utf-8")
        self.assertIn('data-testid="devotion-export-txt"', devotion_src)
        self.assertIn('data-testid="devotion-export-pdf"', devotion_src)
        self.assertIn('data-testid={`disciple-end-rel-${r.id}`}', disciple_src)
        self.assertIn("disciple-end-rel-rel-77", test_file)

    def test_slice_15_sparse_arrays_and_regex_character_class(self):
        gift_src = (ROOT / "src/GiftCallingView.jsx").read_text(encoding="utf-8")
        nine_src = (ROOT / "src/NineMarksPage.jsx").read_text(encoding="utf-8")
        voice_src = (ROOT / "src/components/guardian/useGuardianVoice.js").read_text(encoding="utf-8")
        self.assertIn("[null, it.review_type]", gift_src)
        self.assertIn("[null, d.relation_type]", nine_src)
        self.assertIn("[null, r.repentance_status]", nine_src)
        self.assertIn(r".replace(/(?:[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]|\u{FE0F})/gu, '')", voice_src)

    def test_slice_16_app_sphere_panel_ordo_safe_json_and_callnotes_lang(self):
        app_src = (ROOT / "src/App.jsx").read_text(encoding="utf-8")
        ordo_src = (
            ROOT / "src/features/spiritual-formation/components/ordo-amoris/OrdoAmorisDashboard.jsx"
        ).read_text(encoding="utf-8")
        notes_src = (ROOT / "src/realtime/callNotes.js").read_text(encoding="utf-8")
        self.assertNotIn("setActivePanel('garden')", app_src)
        self.assertIn("all = Array.isArray(parsed) ? parsed : []", ordo_src)
        self.assertIn("transcribeAudioBlob(blob, { contentType: contentType || 'audio/webm', language: curLang })", notes_src)

    def test_slice_17_decision_history_principles_and_habits_today_count(self):
        decision_src = (ROOT / "src/DecisionSupportPage.jsx").read_text(encoding="utf-8")
        habits_src = (ROOT / "src/HabitsPage.jsx").read_text(encoding="utf-8")
        test_file = (ROOT / "src/test/DecisionAndHabitsBugfixSlice.test.jsx").read_text(encoding="utf-8")
        self.assertIn("{activeTab === 'history' && renderHistory()}", decision_src)
        self.assertIn("{activeTab === 'principles' && renderPrinciples()}", decision_src)
        self.assertIn('data-testid="selected-decision-detail"', decision_src)
        self.assertIn('data-testid="habits-today-executions"', habits_src)
        self.assertIn("reuse-selected-decision-btn", test_file)

    def test_slice_18_voice_leave_group_and_soul_dashboard_insight_signals(self):
        voice_src = (ROOT / "src/VoiceRoomPage.jsx").read_text(encoding="utf-8")
        soul_src = (ROOT / "src/components/SoulDashboard.jsx").read_text(encoding="utf-8")
        test_file = (ROOT / "src/test/VoiceSoulMissionBugfixSlice.test.jsx").read_text(encoding="utf-8")
        self.assertIn("await leaveVoiceGroup(g.id, token)", voice_src)
        self.assertIn('data-testid="soul-dashboard-insight"', soul_src)
        self.assertIn('data-testid="soul-dashboard-signals"', soul_src)
        self.assertIn("voice-group-leave-g-77", test_file)

    def test_slice_19_mission_adopted_profile_and_i18n_subpages(self):
        mission_src = (ROOT / "src/MissionLifePage.jsx").read_text(encoding="utf-8")
        i18n_src = (ROOT / "src/i18n/translations.js").read_text(encoding="utf-8")
        self.assertIn('data-testid="mission-adopted-profile"', mission_src)
        self.assertIn("'当前使命画像': 'Current Mission Profile'", i18n_src)
        self.assertIn("'载入到当前分辨': 'Load into Current Discernment'", i18n_src)


if __name__ == "__main__":
    unittest.main()
