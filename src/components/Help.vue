<template>
  <div class="info block main-block">
    <p><button class="key">?</button> or <button class="key">H</button> <span>Key mappings</span></p>
    <p><button class="key">C</button> <span>Configuration</span></p>
    <p><button class="key">L</button> <span>Load / re-import image list</span></p>
    <p><button class="key">D</button> <span>Photo detail</span></p>
    <p><button class="key">I</button> <span>Intro screen</span></p>
    <br/>
    <p><button class="key"><icon name="arrow-right"></icon></button> <span>Next image</span></p>
    <p><button class="key"><icon name="arrow-left"></icon></button> <span>Previous image</span></p>
    <p><button class="key">P</button> <span>Pause</span></p>
    <p><button class="key">S</button> <span>Stop (arrow to resume)</span></p>
    <br/>
    <p><button class="key">-</button> <span>Less stars</span></p>
    <p><button class="key">+</button> <span>More stars</span></p>
    <p><button class="key">X</button> <span>Delete</span></p>
    <p><button class="key">R</button> <span>Rotate</span></p>
    <br/>
    <p><button class="key">Q</button> <span>Print debug info</span></p>
  </div>
</template>

<script>
import 'vue-awesome/icons/arrow-right';
import 'vue-awesome/icons/arrow-left';

export default {
  name: 'Help'
};
</script>
