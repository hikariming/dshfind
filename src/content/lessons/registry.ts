// 由脚本生成：所有课程内容的 zh/en 注册表
import type { ComponentType } from "react";

import * as intro_what_is_dsh_zh from "@/content/lessons/intro/what-is-dsh/zh.mdx";
import * as intro_what_is_dsh_en from "@/content/lessons/intro/what-is-dsh/en.mdx";
import * as intro_agent_basics_zh from "@/content/lessons/intro/agent-basics/zh.mdx";
import * as intro_agent_basics_en from "@/content/lessons/intro/agent-basics/en.mdx";
import * as intro_why_dynamic_zh from "@/content/lessons/intro/why-dynamic/zh.mdx";
import * as intro_why_dynamic_en from "@/content/lessons/intro/why-dynamic/en.mdx";
import * as cordis_01_intro_zh from "@/content/lessons/cordis/01-intro/zh.mdx";
import * as cordis_01_intro_en from "@/content/lessons/cordis/01-intro/en.mdx";
import * as cordis_02_motivation_zh from "@/content/lessons/cordis/02-motivation/zh.mdx";
import * as cordis_02_motivation_en from "@/content/lessons/cordis/02-motivation/en.mdx";
import * as cordis_03_contributions_types_zh from "@/content/lessons/cordis/03-contributions-types/zh.mdx";
import * as cordis_03_contributions_types_en from "@/content/lessons/cordis/03-contributions-types/en.mdx";
import * as cordis_04_monad_zh from "@/content/lessons/cordis/04-monad/zh.mdx";
import * as cordis_04_monad_en from "@/content/lessons/cordis/04-monad/en.mdx";
import * as cordis_05_coeffect_zh from "@/content/lessons/cordis/05-coeffect/zh.mdx";
import * as cordis_05_coeffect_en from "@/content/lessons/cordis/05-coeffect/en.mdx";
import * as cordis_06_revertible_effects_zh from "@/content/lessons/cordis/06-revertible-effects/zh.mdx";
import * as cordis_06_revertible_effects_en from "@/content/lessons/cordis/06-revertible-effects/en.mdx";
import * as cordis_07_effect_composition_zh from "@/content/lessons/cordis/07-effect-composition/zh.mdx";
import * as cordis_07_effect_composition_en from "@/content/lessons/cordis/07-effect-composition/en.mdx";
import * as cordis_08_reactive_coeffects_zh from "@/content/lessons/cordis/08-reactive-coeffects/zh.mdx";
import * as cordis_08_reactive_coeffects_en from "@/content/lessons/cordis/08-reactive-coeffects/en.mdx";
import * as cordis_09_lifecycle_zh from "@/content/lessons/cordis/09-lifecycle/zh.mdx";
import * as cordis_09_lifecycle_en from "@/content/lessons/cordis/09-lifecycle/en.mdx";
import * as cordis_10_context_paradigm_zh from "@/content/lessons/cordis/10-context-paradigm/zh.mdx";
import * as cordis_10_context_paradigm_en from "@/content/lessons/cordis/10-context-paradigm/en.mdx";
import * as cordis_11_core_library_zh from "@/content/lessons/cordis/11-core-library/zh.mdx";
import * as cordis_11_core_library_en from "@/content/lessons/cordis/11-core-library/en.mdx";
import * as cordis_12_loader_koishi_zh from "@/content/lessons/cordis/12-loader-koishi/zh.mdx";
import * as cordis_12_loader_koishi_en from "@/content/lessons/cordis/12-loader-koishi/en.mdx";
import * as cordis_13_discussion_zh from "@/content/lessons/cordis/13-discussion/zh.mdx";
import * as cordis_13_discussion_en from "@/content/lessons/cordis/13-discussion/en.mdx";
import * as core_01_boot_config_zh from "@/content/lessons/core/01-boot-config/zh.mdx";
import * as core_01_boot_config_en from "@/content/lessons/core/01-boot-config/en.mdx";
import * as core_02_ctx_basics_zh from "@/content/lessons/core/02-ctx-basics/zh.mdx";
import * as core_02_ctx_basics_en from "@/content/lessons/core/02-ctx-basics/en.mdx";
import * as core_03_agent_loop_session_zh from "@/content/lessons/core/03-agent-loop-session/zh.mdx";
import * as core_03_agent_loop_session_en from "@/content/lessons/core/03-agent-loop-session/en.mdx";
import * as core_04_tools_execution_zh from "@/content/lessons/core/04-tools-execution/zh.mdx";
import * as core_04_tools_execution_en from "@/content/lessons/core/04-tools-execution/en.mdx";
import * as core_05_sandbox_security_zh from "@/content/lessons/core/05-sandbox-security/zh.mdx";
import * as core_05_sandbox_security_en from "@/content/lessons/core/05-sandbox-security/en.mdx";
import * as core_06_senses_context_zh from "@/content/lessons/core/06-senses-context/zh.mdx";
import * as core_06_senses_context_en from "@/content/lessons/core/06-senses-context/en.mdx";
import * as core_07_goals_collab_zh from "@/content/lessons/core/07-goals-collab/zh.mdx";
import * as core_07_goals_collab_en from "@/content/lessons/core/07-goals-collab/en.mdx";
import * as core_08_self_evolution_zh from "@/content/lessons/core/08-self-evolution/zh.mdx";
import * as core_08_self_evolution_en from "@/content/lessons/core/08-self-evolution/en.mdx";
import * as core_09_event_system_zh from "@/content/lessons/core/09-event-system/zh.mdx";
import * as core_09_event_system_en from "@/content/lessons/core/09-event-system/en.mdx";
import * as core_10_code_map_zh from "@/content/lessons/core/10-code-map/zh.mdx";
import * as core_10_code_map_en from "@/content/lessons/core/10-code-map/en.mdx";
import * as core_11_plugin_anatomy_zh from "@/content/lessons/core/11-plugin-anatomy/zh.mdx";
import * as core_11_plugin_anatomy_en from "@/content/lessons/core/11-plugin-anatomy/en.mdx";
import * as core_12_web_ui_zh from "@/content/lessons/core/12-web-ui/zh.mdx";
import * as core_12_web_ui_en from "@/content/lessons/core/12-web-ui/en.mdx";
import * as dev_01_hello_plugin_zh from "@/content/lessons/dev/01-hello-plugin/zh.mdx";
import * as dev_01_hello_plugin_en from "@/content/lessons/dev/01-hello-plugin/en.mdx";
import * as dev_02_write_tool_zh from "@/content/lessons/dev/02-write-tool/zh.mdx";
import * as dev_02_write_tool_en from "@/content/lessons/dev/02-write-tool/en.mdx";
import * as dev_03_write_service_zh from "@/content/lessons/dev/03-write-service/zh.mdx";
import * as dev_03_write_service_en from "@/content/lessons/dev/03-write-service/en.mdx";
import * as dev_04_listen_events_zh from "@/content/lessons/dev/04-listen-events/zh.mdx";
import * as dev_04_listen_events_en from "@/content/lessons/dev/04-listen-events/en.mdx";
import * as dev_05_config_publish_zh from "@/content/lessons/dev/05-config-publish/zh.mdx";
import * as dev_05_config_publish_en from "@/content/lessons/dev/05-config-publish/en.mdx";
import * as dev_06_advanced_zh from "@/content/lessons/dev/06-advanced/zh.mdx";
import * as dev_06_advanced_en from "@/content/lessons/dev/06-advanced/en.mdx";

import * as plugin_01_what_is_plugin_zh from "@/content/lessons/plugin/01-what-is-plugin/zh.mdx";
import * as plugin_01_what_is_plugin_en from "@/content/lessons/plugin/01-what-is-plugin/en.mdx";
import * as plugin_02_what_can_plugins_do_zh from "@/content/lessons/plugin/02-what-can-plugins-do/zh.mdx";
import * as plugin_02_what_can_plugins_do_en from "@/content/lessons/plugin/02-what-can-plugins-do/en.mdx";
import * as plugin_03_how_to_build_zh from "@/content/lessons/plugin/03-how-to-build/zh.mdx";
import * as plugin_03_how_to_build_en from "@/content/lessons/plugin/03-how-to-build/en.mdx";

const registry: Record<string, Record<string, Record<string, { default: ComponentType<any> }>>> = {
  intro: {
    "what-is-dsh": {
      zh: intro_what_is_dsh_zh,
      en: intro_what_is_dsh_en,
    },
    "agent-basics": {
      zh: intro_agent_basics_zh,
      en: intro_agent_basics_en,
    },
    "why-dynamic": {
      zh: intro_why_dynamic_zh,
      en: intro_why_dynamic_en,
    },
  },
  cordis: {
    "01-intro": {
      zh: cordis_01_intro_zh,
      en: cordis_01_intro_en,
    },
    "02-motivation": {
      zh: cordis_02_motivation_zh,
      en: cordis_02_motivation_en,
    },
    "03-contributions-types": {
      zh: cordis_03_contributions_types_zh,
      en: cordis_03_contributions_types_en,
    },
    "04-monad": {
      zh: cordis_04_monad_zh,
      en: cordis_04_monad_en,
    },
    "05-coeffect": {
      zh: cordis_05_coeffect_zh,
      en: cordis_05_coeffect_en,
    },
    "06-revertible-effects": {
      zh: cordis_06_revertible_effects_zh,
      en: cordis_06_revertible_effects_en,
    },
    "07-effect-composition": {
      zh: cordis_07_effect_composition_zh,
      en: cordis_07_effect_composition_en,
    },
    "08-reactive-coeffects": {
      zh: cordis_08_reactive_coeffects_zh,
      en: cordis_08_reactive_coeffects_en,
    },
    "09-lifecycle": {
      zh: cordis_09_lifecycle_zh,
      en: cordis_09_lifecycle_en,
    },
    "10-context-paradigm": {
      zh: cordis_10_context_paradigm_zh,
      en: cordis_10_context_paradigm_en,
    },
    "11-core-library": {
      zh: cordis_11_core_library_zh,
      en: cordis_11_core_library_en,
    },
    "12-loader-koishi": {
      zh: cordis_12_loader_koishi_zh,
      en: cordis_12_loader_koishi_en,
    },
    "13-discussion": {
      zh: cordis_13_discussion_zh,
      en: cordis_13_discussion_en,
    },
  },
  core: {
    "01-boot-config": {
      zh: core_01_boot_config_zh,
      en: core_01_boot_config_en,
    },
    "02-ctx-basics": {
      zh: core_02_ctx_basics_zh,
      en: core_02_ctx_basics_en,
    },
    "03-agent-loop-session": {
      zh: core_03_agent_loop_session_zh,
      en: core_03_agent_loop_session_en,
    },
    "04-tools-execution": {
      zh: core_04_tools_execution_zh,
      en: core_04_tools_execution_en,
    },
    "05-sandbox-security": {
      zh: core_05_sandbox_security_zh,
      en: core_05_sandbox_security_en,
    },
    "06-senses-context": {
      zh: core_06_senses_context_zh,
      en: core_06_senses_context_en,
    },
    "07-goals-collab": {
      zh: core_07_goals_collab_zh,
      en: core_07_goals_collab_en,
    },
    "08-self-evolution": {
      zh: core_08_self_evolution_zh,
      en: core_08_self_evolution_en,
    },
    "09-event-system": {
      zh: core_09_event_system_zh,
      en: core_09_event_system_en,
    },
    "10-code-map": {
      zh: core_10_code_map_zh,
      en: core_10_code_map_en,
    },
    "11-plugin-anatomy": {
      zh: core_11_plugin_anatomy_zh,
      en: core_11_plugin_anatomy_en,
    },
    "12-web-ui": {
      zh: core_12_web_ui_zh,
      en: core_12_web_ui_en,
    },
  },
  dev: {
    "01-hello-plugin": {
      zh: dev_01_hello_plugin_zh,
      en: dev_01_hello_plugin_en,
    },
    "02-write-tool": {
      zh: dev_02_write_tool_zh,
      en: dev_02_write_tool_en,
    },
    "03-write-service": {
      zh: dev_03_write_service_zh,
      en: dev_03_write_service_en,
    },
    "04-listen-events": {
      zh: dev_04_listen_events_zh,
      en: dev_04_listen_events_en,
    },
    "05-config-publish": {
      zh: dev_05_config_publish_zh,
      en: dev_05_config_publish_en,
    },
    "06-advanced": {
      zh: dev_06_advanced_zh,
      en: dev_06_advanced_en,
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
