<template>
  <ul :class="className">
    <li v-if="source.facebook" class="inline-block">
      <a aria-label="facebook" :href="source.facebook" target="_blank" rel="noopener noreferrer nofollow">
        <Icon name="ion:logo-facebook" />
      </a>
    </li>
    <li v-if="source.twitter" class="inline-block">
      <a aria-label="twitter" :href="source.twitter" target="_blank" rel="noopener noreferrer nofollow">
        <Icon name="ion:logo-twitter" />
      </a>
    </li>
    <li v-if="source.instagram" class="inline-block">
      <a aria-label="instagram" :href="source.instagram" target="_blank" rel="noopener noreferrer nofollow">
        <Icon name="ion:logo-instagram" />
      </a>
    </li>
    <li v-if="source.youtube" class="inline-block">
      <a aria-label="youtube" :href="source.youtube" target="_blank" rel="noopener noreferrer nofollow">
        <Icon name="ion:logo-youtube" />
      </a>
    </li>
    <li v-if="source.linkedin" class="inline-block">
      <a aria-label="linkedin" :href="source.linkedin" target="_blank" rel="noopener noreferrer nofollow">
        <Icon name="ion:logo-linkedin" />
      </a>
    </li>
    <li v-if="source.github" class="inline-block">
      <a aria-label="github" :href="source.github" target="_blank" rel="noopener noreferrer nofollow">
        <Icon name="ion:logo-github" />
      </a>
    </li>
    <li v-if="source.gitlab" class="inline-block">
      <a aria-label="gitlab" :href="source.gitlab" target="_blank" rel="noopener noreferrer nofollow">
        <Icon name="ion:logo-gitlab" />
      </a>
    </li>
    <li v-if="source.discord" class="inline-block">
      <a aria-label="discord" :href="source.discord" target="_blank" rel="noopener noreferrer nofollow">
        <Icon name="ion:logo-discord" />
      </a>
    </li>
    <li v-if="source.slack" class="inline-block">
      <a aria-label="slack" :href="source.slack" target="_blank" rel="noopener noreferrer nofollow">
        <Icon name="ion:logo-slack" />
      </a>
    </li>
    <li v-if="source.medium" class="inline-block">
      <a aria-label="medium" :href="source.medium" target="_blank" rel="noopener noreferrer nofollow">
        <Icon name="ion:logo-medium" />
      </a>
    </li>
    <li v-if="source.codepen" class="inline-block">
      <a aria-label="codepen" :href="source.codepen" target="_blank" rel="noopener noreferrer nofollow">
        <Icon name="ion:logo-codepen" />
      </a>
    </li>
    <li v-if="source.bitbucket" class="inline-block">
      <a aria-label="bitbucket" :href="source.bitbucket" target="_blank" rel="noopener noreferrer nofollow">
        <Icon name="ion:logo-bitbucket" />
      </a>
    </li>
    <li v-if="source.dribbble" class="inline-block">
      <a aria-label="dribbble" :href="source.dribbble" target="_blank" rel="noopener noreferrer nofollow">
        <Icon name="ion:logo-dribbble" />
      </a>
    </li>
    <li v-if="source.behance" class="inline-block">
      <a aria-label="behance" :href="source.behance" target="_blank" rel="noopener noreferrer nofollow">
        <Icon name="ion:logo-behance" />
      </a>
    </li>
    <li v-if="source.pinterest" class="inline-block">
      <a aria-label="pinterest" :href="source.pinterest" target="_blank" rel="noopener noreferrer nofollow">
        <Icon name="ion:logo-pinterest" />
      </a>
    </li>
    <li v-if="source.soundcloud" class="inline-block">
      <a aria-label="soundcloud" :href="source.soundcloud" target="_blank" rel="noopener noreferrer nofollow">
        <Icon name="ion:logo-soundcloud" />
      </a>
    </li>
    <li v-if="source.tumblr" class="inline-block">
      <a aria-label="tumblr" :href="source.tumblr" target="_blank" rel="noopener noreferrer nofollow">
        <Icon name="ion:logo-tumblr" />
      </a>
    </li>
    <li v-if="source.reddit" class="inline-block">
      <a aria-label="reddit" :href="source.reddit" target="_blank" rel="noopener noreferrer nofollow">
        <Icon name="ion:logo-reddit" />
      </a>
    </li>
    <li v-if="source.vk" class="inline-block">
      <a aria-label="vk" :href="source.vk" target="_blank" rel="noopener noreferrer nofollow">
        <Icon name="ion:logo-vk" />
      </a>
    </li>
    <li v-if="source.whatsapp" class="inline-block">
      <a aria-label="whatsapp" :href="source.whatsapp" target="_blank" rel="noopener noreferrer nofollow">
        <Icon name="ion:logo-whatsapp" />
      </a>
    </li>
    <li v-if="source.snapchat" class="inline-block">
      <a aria-label="snapchat" :href="source.snapchat" target="_blank" rel="noopener noreferrer nofollow">
        <Icon name="ion:logo-snapchat" />
      </a>
    </li>
    <li v-if="source.vimeo" class="inline-block">
      <a aria-label="vimeo" :href="source.vimeo" target="_blank" rel="noopener noreferrer nofollow">
        <Icon name="ion:logo-vimeo" />
      </a>
    </li>
    <li v-if="source.tiktok" class="inline-block">
      <a aria-label="tiktok" :href="source.tiktok" target="_blank" rel="noopener noreferrer nofollow">
        <Icon name="ion:logo-tiktok" />
      </a>
    </li>
    <li v-if="source.foursquare" class="inline-block">
      <a aria-label="foursquare" :href="source.foursquare" target="_blank" rel="noopener noreferrer nofollow">
        <Icon name="ion:logo-foursquare" />
      </a>
    </li>
    <li v-if="source.skype" class="inline-block">
      <a aria-label="skype" :href="source.skype" target="_blank" rel="noopener noreferrer nofollow">
        <Icon name="ion:logo-skype" />
      </a>
    </li>
    <li v-if="source.website" class="inline-block">
      <a aria-label="website" :href="source.website" target="_blank" rel="noopener noreferrer nofollow">
        <Icon name="ion:globe-outline" />
      </a>
    </li>
    <li v-if="source.rss" class="inline-block">
      <a aria-label="rss feed" :href="source.rss" target="_blank" rel="noopener noreferrer nofollow">
        <Icon name="ion:logo-rss" />
      </a>
    </li>
    <li v-if="source.email" class="inline-block">
      <a aria-label="email" :href="'mailto:' + source.email">
        <Icon name="ion:mail" />
      </a>
    </li>
    <li v-if="source.phone" class="inline-block">
      <a aria-label="telephone" :href="'tel:' + source.phone">
        <Icon name="ion:call" />
      </a>
    </li>
    <li v-if="source.address" class="inline-block">
      <a aria-label="location" :href="source.address" target="_blank" rel="noopener noreferrer nofollow">
        <Icon name="ion:location" />
      </a>
    </li>
  </ul>
</template>

<script setup>
defineProps({
  source: { type: Object, required: true },
  className: { type: String, default: "" },
});
</script>
