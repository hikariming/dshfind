// 由 scripts/gen-lessons-registry.mjs 生成：所有课程内容的注册表（含已存在的各语言版本）
import type { MDXContent } from "mdx/types";

import * as cordis_01_intro_zh from "@/content/lessons/cordis/01-intro/zh.mdx";
import * as cordis_01_intro_en from "@/content/lessons/cordis/01-intro/en.mdx";
import * as cordis_01_intro_ja from "@/content/lessons/cordis/01-intro/ja.mdx";
import * as cordis_01_intro_ko from "@/content/lessons/cordis/01-intro/ko.mdx";
import * as cordis_02_motivation_zh from "@/content/lessons/cordis/02-motivation/zh.mdx";
import * as cordis_02_motivation_en from "@/content/lessons/cordis/02-motivation/en.mdx";
import * as cordis_02_motivation_ja from "@/content/lessons/cordis/02-motivation/ja.mdx";
import * as cordis_02_motivation_ko from "@/content/lessons/cordis/02-motivation/ko.mdx";
import * as cordis_03_contributions_types_zh from "@/content/lessons/cordis/03-contributions-types/zh.mdx";
import * as cordis_03_contributions_types_en from "@/content/lessons/cordis/03-contributions-types/en.mdx";
import * as cordis_03_contributions_types_ja from "@/content/lessons/cordis/03-contributions-types/ja.mdx";
import * as cordis_03_contributions_types_ko from "@/content/lessons/cordis/03-contributions-types/ko.mdx";
import * as cordis_04_monad_zh from "@/content/lessons/cordis/04-monad/zh.mdx";
import * as cordis_04_monad_en from "@/content/lessons/cordis/04-monad/en.mdx";
import * as cordis_04_monad_ja from "@/content/lessons/cordis/04-monad/ja.mdx";
import * as cordis_04_monad_ko from "@/content/lessons/cordis/04-monad/ko.mdx";
import * as cordis_05_coeffect_zh from "@/content/lessons/cordis/05-coeffect/zh.mdx";
import * as cordis_05_coeffect_en from "@/content/lessons/cordis/05-coeffect/en.mdx";
import * as cordis_05_coeffect_ja from "@/content/lessons/cordis/05-coeffect/ja.mdx";
import * as cordis_05_coeffect_ko from "@/content/lessons/cordis/05-coeffect/ko.mdx";
import * as cordis_06_revertible_effects_zh from "@/content/lessons/cordis/06-revertible-effects/zh.mdx";
import * as cordis_06_revertible_effects_en from "@/content/lessons/cordis/06-revertible-effects/en.mdx";
import * as cordis_06_revertible_effects_ja from "@/content/lessons/cordis/06-revertible-effects/ja.mdx";
import * as cordis_06_revertible_effects_ko from "@/content/lessons/cordis/06-revertible-effects/ko.mdx";
import * as cordis_07_effect_composition_zh from "@/content/lessons/cordis/07-effect-composition/zh.mdx";
import * as cordis_07_effect_composition_en from "@/content/lessons/cordis/07-effect-composition/en.mdx";
import * as cordis_07_effect_composition_ja from "@/content/lessons/cordis/07-effect-composition/ja.mdx";
import * as cordis_07_effect_composition_ko from "@/content/lessons/cordis/07-effect-composition/ko.mdx";
import * as cordis_08_reactive_coeffects_zh from "@/content/lessons/cordis/08-reactive-coeffects/zh.mdx";
import * as cordis_08_reactive_coeffects_en from "@/content/lessons/cordis/08-reactive-coeffects/en.mdx";
import * as cordis_08_reactive_coeffects_ja from "@/content/lessons/cordis/08-reactive-coeffects/ja.mdx";
import * as cordis_08_reactive_coeffects_ko from "@/content/lessons/cordis/08-reactive-coeffects/ko.mdx";
import * as cordis_09_lifecycle_zh from "@/content/lessons/cordis/09-lifecycle/zh.mdx";
import * as cordis_09_lifecycle_en from "@/content/lessons/cordis/09-lifecycle/en.mdx";
import * as cordis_09_lifecycle_ja from "@/content/lessons/cordis/09-lifecycle/ja.mdx";
import * as cordis_09_lifecycle_ko from "@/content/lessons/cordis/09-lifecycle/ko.mdx";
import * as cordis_10_context_paradigm_zh from "@/content/lessons/cordis/10-context-paradigm/zh.mdx";
import * as cordis_10_context_paradigm_en from "@/content/lessons/cordis/10-context-paradigm/en.mdx";
import * as cordis_10_context_paradigm_ja from "@/content/lessons/cordis/10-context-paradigm/ja.mdx";
import * as cordis_10_context_paradigm_ko from "@/content/lessons/cordis/10-context-paradigm/ko.mdx";
import * as cordis_11_core_library_zh from "@/content/lessons/cordis/11-core-library/zh.mdx";
import * as cordis_11_core_library_en from "@/content/lessons/cordis/11-core-library/en.mdx";
import * as cordis_11_core_library_ja from "@/content/lessons/cordis/11-core-library/ja.mdx";
import * as cordis_11_core_library_ko from "@/content/lessons/cordis/11-core-library/ko.mdx";
import * as cordis_12_loader_koishi_zh from "@/content/lessons/cordis/12-loader-koishi/zh.mdx";
import * as cordis_12_loader_koishi_en from "@/content/lessons/cordis/12-loader-koishi/en.mdx";
import * as cordis_12_loader_koishi_ja from "@/content/lessons/cordis/12-loader-koishi/ja.mdx";
import * as cordis_12_loader_koishi_ko from "@/content/lessons/cordis/12-loader-koishi/ko.mdx";
import * as cordis_13_discussion_zh from "@/content/lessons/cordis/13-discussion/zh.mdx";
import * as cordis_13_discussion_en from "@/content/lessons/cordis/13-discussion/en.mdx";
import * as cordis_13_discussion_ja from "@/content/lessons/cordis/13-discussion/ja.mdx";
import * as cordis_13_discussion_ko from "@/content/lessons/cordis/13-discussion/ko.mdx";
import * as core_01_boot_config_zh from "@/content/lessons/core/01-boot-config/zh.mdx";
import * as core_01_boot_config_en from "@/content/lessons/core/01-boot-config/en.mdx";
import * as core_01_boot_config_ja from "@/content/lessons/core/01-boot-config/ja.mdx";
import * as core_01_boot_config_ko from "@/content/lessons/core/01-boot-config/ko.mdx";
import * as core_02_ctx_basics_zh from "@/content/lessons/core/02-ctx-basics/zh.mdx";
import * as core_02_ctx_basics_en from "@/content/lessons/core/02-ctx-basics/en.mdx";
import * as core_02_ctx_basics_ja from "@/content/lessons/core/02-ctx-basics/ja.mdx";
import * as core_02_ctx_basics_ko from "@/content/lessons/core/02-ctx-basics/ko.mdx";
import * as core_03_agent_loop_session_zh from "@/content/lessons/core/03-agent-loop-session/zh.mdx";
import * as core_03_agent_loop_session_en from "@/content/lessons/core/03-agent-loop-session/en.mdx";
import * as core_03_agent_loop_session_ja from "@/content/lessons/core/03-agent-loop-session/ja.mdx";
import * as core_03_agent_loop_session_ko from "@/content/lessons/core/03-agent-loop-session/ko.mdx";
import * as core_04_tools_execution_zh from "@/content/lessons/core/04-tools-execution/zh.mdx";
import * as core_04_tools_execution_en from "@/content/lessons/core/04-tools-execution/en.mdx";
import * as core_04_tools_execution_ja from "@/content/lessons/core/04-tools-execution/ja.mdx";
import * as core_04_tools_execution_ko from "@/content/lessons/core/04-tools-execution/ko.mdx";
import * as core_05_sandbox_security_zh from "@/content/lessons/core/05-sandbox-security/zh.mdx";
import * as core_05_sandbox_security_en from "@/content/lessons/core/05-sandbox-security/en.mdx";
import * as core_05_sandbox_security_ja from "@/content/lessons/core/05-sandbox-security/ja.mdx";
import * as core_05_sandbox_security_ko from "@/content/lessons/core/05-sandbox-security/ko.mdx";
import * as core_06_senses_context_zh from "@/content/lessons/core/06-senses-context/zh.mdx";
import * as core_06_senses_context_en from "@/content/lessons/core/06-senses-context/en.mdx";
import * as core_06_senses_context_ja from "@/content/lessons/core/06-senses-context/ja.mdx";
import * as core_06_senses_context_ko from "@/content/lessons/core/06-senses-context/ko.mdx";
import * as core_07_goals_collab_zh from "@/content/lessons/core/07-goals-collab/zh.mdx";
import * as core_07_goals_collab_en from "@/content/lessons/core/07-goals-collab/en.mdx";
import * as core_07_goals_collab_ja from "@/content/lessons/core/07-goals-collab/ja.mdx";
import * as core_07_goals_collab_ko from "@/content/lessons/core/07-goals-collab/ko.mdx";
import * as core_08_self_evolution_zh from "@/content/lessons/core/08-self-evolution/zh.mdx";
import * as core_08_self_evolution_en from "@/content/lessons/core/08-self-evolution/en.mdx";
import * as core_08_self_evolution_ja from "@/content/lessons/core/08-self-evolution/ja.mdx";
import * as core_08_self_evolution_ko from "@/content/lessons/core/08-self-evolution/ko.mdx";
import * as core_09_event_system_zh from "@/content/lessons/core/09-event-system/zh.mdx";
import * as core_09_event_system_en from "@/content/lessons/core/09-event-system/en.mdx";
import * as core_09_event_system_ja from "@/content/lessons/core/09-event-system/ja.mdx";
import * as core_09_event_system_ko from "@/content/lessons/core/09-event-system/ko.mdx";
import * as core_10_code_map_zh from "@/content/lessons/core/10-code-map/zh.mdx";
import * as core_10_code_map_en from "@/content/lessons/core/10-code-map/en.mdx";
import * as core_10_code_map_ja from "@/content/lessons/core/10-code-map/ja.mdx";
import * as core_10_code_map_ko from "@/content/lessons/core/10-code-map/ko.mdx";
import * as core_11_plugin_anatomy_zh from "@/content/lessons/core/11-plugin-anatomy/zh.mdx";
import * as core_11_plugin_anatomy_en from "@/content/lessons/core/11-plugin-anatomy/en.mdx";
import * as core_11_plugin_anatomy_ja from "@/content/lessons/core/11-plugin-anatomy/ja.mdx";
import * as core_11_plugin_anatomy_ko from "@/content/lessons/core/11-plugin-anatomy/ko.mdx";
import * as core_12_web_ui_zh from "@/content/lessons/core/12-web-ui/zh.mdx";
import * as core_12_web_ui_en from "@/content/lessons/core/12-web-ui/en.mdx";
import * as core_12_web_ui_ja from "@/content/lessons/core/12-web-ui/ja.mdx";
import * as core_12_web_ui_ko from "@/content/lessons/core/12-web-ui/ko.mdx";
import * as dev_01_hello_plugin_zh from "@/content/lessons/dev/01-hello-plugin/zh.mdx";
import * as dev_01_hello_plugin_en from "@/content/lessons/dev/01-hello-plugin/en.mdx";
import * as dev_01_hello_plugin_ja from "@/content/lessons/dev/01-hello-plugin/ja.mdx";
import * as dev_01_hello_plugin_ko from "@/content/lessons/dev/01-hello-plugin/ko.mdx";
import * as dev_02_write_tool_zh from "@/content/lessons/dev/02-write-tool/zh.mdx";
import * as dev_02_write_tool_en from "@/content/lessons/dev/02-write-tool/en.mdx";
import * as dev_02_write_tool_ja from "@/content/lessons/dev/02-write-tool/ja.mdx";
import * as dev_02_write_tool_ko from "@/content/lessons/dev/02-write-tool/ko.mdx";
import * as dev_03_write_service_zh from "@/content/lessons/dev/03-write-service/zh.mdx";
import * as dev_03_write_service_en from "@/content/lessons/dev/03-write-service/en.mdx";
import * as dev_03_write_service_ja from "@/content/lessons/dev/03-write-service/ja.mdx";
import * as dev_03_write_service_ko from "@/content/lessons/dev/03-write-service/ko.mdx";
import * as dev_04_listen_events_zh from "@/content/lessons/dev/04-listen-events/zh.mdx";
import * as dev_04_listen_events_en from "@/content/lessons/dev/04-listen-events/en.mdx";
import * as dev_04_listen_events_ja from "@/content/lessons/dev/04-listen-events/ja.mdx";
import * as dev_04_listen_events_ko from "@/content/lessons/dev/04-listen-events/ko.mdx";
import * as dev_05_config_publish_zh from "@/content/lessons/dev/05-config-publish/zh.mdx";
import * as dev_05_config_publish_en from "@/content/lessons/dev/05-config-publish/en.mdx";
import * as dev_05_config_publish_ja from "@/content/lessons/dev/05-config-publish/ja.mdx";
import * as dev_05_config_publish_ko from "@/content/lessons/dev/05-config-publish/ko.mdx";
import * as dev_06_advanced_zh from "@/content/lessons/dev/06-advanced/zh.mdx";
import * as dev_06_advanced_en from "@/content/lessons/dev/06-advanced/en.mdx";
import * as dev_06_advanced_ja from "@/content/lessons/dev/06-advanced/ja.mdx";
import * as dev_06_advanced_ko from "@/content/lessons/dev/06-advanced/ko.mdx";
import * as intro_agent_basics_zh from "@/content/lessons/intro/agent-basics/zh.mdx";
import * as intro_agent_basics_en from "@/content/lessons/intro/agent-basics/en.mdx";
import * as intro_agent_basics_ja from "@/content/lessons/intro/agent-basics/ja.mdx";
import * as intro_agent_basics_ko from "@/content/lessons/intro/agent-basics/ko.mdx";
import * as intro_what_is_dsh_zh from "@/content/lessons/intro/what-is-dsh/zh.mdx";
import * as intro_what_is_dsh_en from "@/content/lessons/intro/what-is-dsh/en.mdx";
import * as intro_what_is_dsh_ja from "@/content/lessons/intro/what-is-dsh/ja.mdx";
import * as intro_what_is_dsh_ko from "@/content/lessons/intro/what-is-dsh/ko.mdx";
import * as intro_why_dynamic_zh from "@/content/lessons/intro/why-dynamic/zh.mdx";
import * as intro_why_dynamic_en from "@/content/lessons/intro/why-dynamic/en.mdx";
import * as intro_why_dynamic_ja from "@/content/lessons/intro/why-dynamic/ja.mdx";
import * as intro_why_dynamic_ko from "@/content/lessons/intro/why-dynamic/ko.mdx";
import * as plugin_01_what_is_plugin_zh from "@/content/lessons/plugin/01-what-is-plugin/zh.mdx";
import * as plugin_01_what_is_plugin_en from "@/content/lessons/plugin/01-what-is-plugin/en.mdx";
import * as plugin_02_what_can_plugins_do_zh from "@/content/lessons/plugin/02-what-can-plugins-do/zh.mdx";
import * as plugin_02_what_can_plugins_do_en from "@/content/lessons/plugin/02-what-can-plugins-do/en.mdx";
import * as plugin_03_how_to_build_zh from "@/content/lessons/plugin/03-how-to-build/zh.mdx";
import * as plugin_03_how_to_build_en from "@/content/lessons/plugin/03-how-to-build/en.mdx";

const registry: Record<string, Record<string, Record<string, { default: MDXContent }>>> = {
  cordis: {
    "01-intro": {
      zh: cordis_01_intro_zh,
      en: cordis_01_intro_en,
      ja: cordis_01_intro_ja,
      ko: cordis_01_intro_ko,
    },
    "02-motivation": {
      zh: cordis_02_motivation_zh,
      en: cordis_02_motivation_en,
      ja: cordis_02_motivation_ja,
      ko: cordis_02_motivation_ko,
    },
    "03-contributions-types": {
      zh: cordis_03_contributions_types_zh,
      en: cordis_03_contributions_types_en,
      ja: cordis_03_contributions_types_ja,
      ko: cordis_03_contributions_types_ko,
    },
    "04-monad": {
      zh: cordis_04_monad_zh,
      en: cordis_04_monad_en,
      ja: cordis_04_monad_ja,
      ko: cordis_04_monad_ko,
    },
    "05-coeffect": {
      zh: cordis_05_coeffect_zh,
      en: cordis_05_coeffect_en,
      ja: cordis_05_coeffect_ja,
      ko: cordis_05_coeffect_ko,
    },
    "06-revertible-effects": {
      zh: cordis_06_revertible_effects_zh,
      en: cordis_06_revertible_effects_en,
      ja: cordis_06_revertible_effects_ja,
      ko: cordis_06_revertible_effects_ko,
    },
    "07-effect-composition": {
      zh: cordis_07_effect_composition_zh,
      en: cordis_07_effect_composition_en,
      ja: cordis_07_effect_composition_ja,
      ko: cordis_07_effect_composition_ko,
    },
    "08-reactive-coeffects": {
      zh: cordis_08_reactive_coeffects_zh,
      en: cordis_08_reactive_coeffects_en,
      ja: cordis_08_reactive_coeffects_ja,
      ko: cordis_08_reactive_coeffects_ko,
    },
    "09-lifecycle": {
      zh: cordis_09_lifecycle_zh,
      en: cordis_09_lifecycle_en,
      ja: cordis_09_lifecycle_ja,
      ko: cordis_09_lifecycle_ko,
    },
    "10-context-paradigm": {
      zh: cordis_10_context_paradigm_zh,
      en: cordis_10_context_paradigm_en,
      ja: cordis_10_context_paradigm_ja,
      ko: cordis_10_context_paradigm_ko,
    },
    "11-core-library": {
      zh: cordis_11_core_library_zh,
      en: cordis_11_core_library_en,
      ja: cordis_11_core_library_ja,
      ko: cordis_11_core_library_ko,
    },
    "12-loader-koishi": {
      zh: cordis_12_loader_koishi_zh,
      en: cordis_12_loader_koishi_en,
      ja: cordis_12_loader_koishi_ja,
      ko: cordis_12_loader_koishi_ko,
    },
    "13-discussion": {
      zh: cordis_13_discussion_zh,
      en: cordis_13_discussion_en,
      ja: cordis_13_discussion_ja,
      ko: cordis_13_discussion_ko,
    },
  },
  core: {
    "01-boot-config": {
      zh: core_01_boot_config_zh,
      en: core_01_boot_config_en,
      ja: core_01_boot_config_ja,
      ko: core_01_boot_config_ko,
    },
    "02-ctx-basics": {
      zh: core_02_ctx_basics_zh,
      en: core_02_ctx_basics_en,
      ja: core_02_ctx_basics_ja,
      ko: core_02_ctx_basics_ko,
    },
    "03-agent-loop-session": {
      zh: core_03_agent_loop_session_zh,
      en: core_03_agent_loop_session_en,
      ja: core_03_agent_loop_session_ja,
      ko: core_03_agent_loop_session_ko,
    },
    "04-tools-execution": {
      zh: core_04_tools_execution_zh,
      en: core_04_tools_execution_en,
      ja: core_04_tools_execution_ja,
      ko: core_04_tools_execution_ko,
    },
    "05-sandbox-security": {
      zh: core_05_sandbox_security_zh,
      en: core_05_sandbox_security_en,
      ja: core_05_sandbox_security_ja,
      ko: core_05_sandbox_security_ko,
    },
    "06-senses-context": {
      zh: core_06_senses_context_zh,
      en: core_06_senses_context_en,
      ja: core_06_senses_context_ja,
      ko: core_06_senses_context_ko,
    },
    "07-goals-collab": {
      zh: core_07_goals_collab_zh,
      en: core_07_goals_collab_en,
      ja: core_07_goals_collab_ja,
      ko: core_07_goals_collab_ko,
    },
    "08-self-evolution": {
      zh: core_08_self_evolution_zh,
      en: core_08_self_evolution_en,
      ja: core_08_self_evolution_ja,
      ko: core_08_self_evolution_ko,
    },
    "09-event-system": {
      zh: core_09_event_system_zh,
      en: core_09_event_system_en,
      ja: core_09_event_system_ja,
      ko: core_09_event_system_ko,
    },
    "10-code-map": {
      zh: core_10_code_map_zh,
      en: core_10_code_map_en,
      ja: core_10_code_map_ja,
      ko: core_10_code_map_ko,
    },
    "11-plugin-anatomy": {
      zh: core_11_plugin_anatomy_zh,
      en: core_11_plugin_anatomy_en,
      ja: core_11_plugin_anatomy_ja,
      ko: core_11_plugin_anatomy_ko,
    },
    "12-web-ui": {
      zh: core_12_web_ui_zh,
      en: core_12_web_ui_en,
      ja: core_12_web_ui_ja,
      ko: core_12_web_ui_ko,
    },
  },
  dev: {
    "01-hello-plugin": {
      zh: dev_01_hello_plugin_zh,
      en: dev_01_hello_plugin_en,
      ja: dev_01_hello_plugin_ja,
      ko: dev_01_hello_plugin_ko,
    },
    "02-write-tool": {
      zh: dev_02_write_tool_zh,
      en: dev_02_write_tool_en,
      ja: dev_02_write_tool_ja,
      ko: dev_02_write_tool_ko,
    },
    "03-write-service": {
      zh: dev_03_write_service_zh,
      en: dev_03_write_service_en,
      ja: dev_03_write_service_ja,
      ko: dev_03_write_service_ko,
    },
    "04-listen-events": {
      zh: dev_04_listen_events_zh,
      en: dev_04_listen_events_en,
      ja: dev_04_listen_events_ja,
      ko: dev_04_listen_events_ko,
    },
    "05-config-publish": {
      zh: dev_05_config_publish_zh,
      en: dev_05_config_publish_en,
      ja: dev_05_config_publish_ja,
      ko: dev_05_config_publish_ko,
    },
    "06-advanced": {
      zh: dev_06_advanced_zh,
      en: dev_06_advanced_en,
      ja: dev_06_advanced_ja,
      ko: dev_06_advanced_ko,
    },
  },
  intro: {
    "agent-basics": {
      zh: intro_agent_basics_zh,
      en: intro_agent_basics_en,
      ja: intro_agent_basics_ja,
      ko: intro_agent_basics_ko,
    },
    "what-is-dsh": {
      zh: intro_what_is_dsh_zh,
      en: intro_what_is_dsh_en,
      ja: intro_what_is_dsh_ja,
      ko: intro_what_is_dsh_ko,
    },
    "why-dynamic": {
      zh: intro_why_dynamic_zh,
      en: intro_why_dynamic_en,
      ja: intro_why_dynamic_ja,
      ko: intro_why_dynamic_ko,
    },
  },
  plugin: {
    "01-what-is-plugin": {
      zh: plugin_01_what_is_plugin_zh,
      en: plugin_01_what_is_plugin_en,
    },
    "02-what-can-plugins-do": {
      zh: plugin_02_what_can_plugins_do_zh,
      en: plugin_02_what_can_plugins_do_en,
    },
    "03-how-to-build": {
      zh: plugin_03_how_to_build_zh,
      en: plugin_03_how_to_build_en,
    },
  },
};

export function getLessonContent(chapter: string, slug: string, locale: string) {
  const m = registry[chapter]?.[slug];
  if (!m) throw new Error(`lesson not found: ${chapter}/${slug}`);
  return m[locale] ?? m.zh;
}
