/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root: true,
  'extends': [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/eslint-config-typescript'
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  overrides: [
    {
      /*
       * The three forms write the readings and the amounts straight into the object
       * the view passes them, instead of emitting an event per field. It is on purpose:
       * the view owns the object and the result recalculates as it is typed, which with
       * around twenty numeric fields would otherwise need a lot of plumbing for nothing.
       * Each of those props says so in its comment.
       */
      files: [
        'src/components/lote/LoteForm.vue',
        'src/components/EnergyConsumptionForm.vue',
        'src/components/ConsumptionInfoTable.vue'
      ],
      rules: {
        'vue/no-mutating-props': 'off'
      }
    }
  ]
}
