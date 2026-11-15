<script setup lang="ts">
useHead({ title: "ProjectTailFairy Playground" });
</script>

<template>
  <main>
    <h1>ProjectTailFairy Playground</h1>
    <p>研究モデルの検証環境です。モデルの学習能力はまだ実証されていません。</p>
    <nav aria-label="検証メニュー">
      <ul>
        <li><NuxtLink to="/Phases">フェーズ検証</NuxtLink></li>
        <li><NuxtLink to="/Experiments">実験・ベンチマーク</NuxtLink></li>
      </ul>
    </nav>
  </main>
</template>
