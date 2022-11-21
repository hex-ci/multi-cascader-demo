<template>
  <div class="multi-cascader-demo">
    <el-popover placement="bottom-start" trigger="manual" :popper-class="popOverClass" v-model="showPopover">
      <div slot="reference">
        <el-select multiple v-model="selectedLabels" placeholder="请选择" :collapse-tags="false" style="width: 100%;" popper-class="hide-popper" @remove-tag="removeTag" @visible-change="visibleChange" />
      </div>
      <div class="multi-cascader-demo-wrapper" v-click-outside="hidePopover">
        <template v-if="options.length > 0">
          <ul class="el-cascader-menu cascader-menu" :style="{width: '160px'}" v-for="(cas, index) in cascaderTree" :key="index">
            <li :class="{
                'el-cascader-menu__item': true,
                'el-cascader-menu__item--extensible': item.children && item.children.length > 0,
                'can-load-children': !item.isLeaf && !item.children,
                'loading-children': !item.isLeaf && item.loading,
                'has-checked-child': item.indeterminate || item.hasCheckedChild,
                'is-active': item.checked,
              }" @click="spreadNext(item.children, index, item)" v-for="(item, itemIdx) in cas" :key="itemIdx" :title="item.label">
              <el-checkbox class="cascader-checkbox" @click.native.stop v-model="item.checked" :indeterminate="item.indeterminate" @change="checked => { checkedChange(item, checked) }" />
              <span>{{ item.label }}</span>
            </li>
          </ul>
        </template>
        <template v-else>
          <ul class="el-cascader-menu cascader-menu">
            <li class="el-cascader-menu__item dropdown__empty">无数据</li>
          </ul>
        </template>
      </div>
    </el-popover>
  </div>
</template>

<script>
import ClickOutside from './click-outside';
import {
  hasArrayChild,
  deepClone,
  getId,
  isPromise
} from './utils';

export default {
  name: 'MultiCascaderDemo',

  props: {
    value: {
      type: Array,
      default: () => []
    },
    options: {
      type: Array,
      default: () => []
    },
    loadChildrenMethod: {
      type: Function,
      default: null,
      return: Promise
    }
  },

  watch: {
    options: {
      deep: true,
      handler() {
        this.initOpts();
        this.initData();
      }
    },
    value: {
      deep: true,
      handler() {
        if (this.selectedValues != this.value) {
          this.initOpts();
          this.initData();
        }
      }
    }
  },

  directives: {
    ClickOutside
  },

  created() {
    this.popOverClass = `cascader-popper popper-class-${getId()}`
    this.initOpts();
    this.initData();
  },

  destroyed() {
    this.clonedOpts = null;
    this.cascaderTree = null;
    this.selectedItems = null;
    this.selectedLabels = null;
    this.selectedvalues = null;
  },

  data() {
    return {
      popOverClass: '',
      showPopover: false,
      clonedOpts: [],
      cascaderTree: [],
      selectedItems: [],
      selectedLabels: [],
      selectedValues: [],
      loadChildrenFunc: null
    };
  },

  methods: {
    initOpts() {
      this.clonedOpts = deepClone(this.options);
      this.recursiveOpt(this.clonedOpts, null);
      this.cascaderTree = [this.clonedOpts];
    },

    initData() {
      this.pickCheckedItem(this.clonedOpts);
    },

    recursiveOpt(nodeArr, parent) {
      nodeArr.forEach(node => {
        if (parent) {
          node.parent = parent;
        }

        node.indeterminate = false;
        node.checked = false;

        if (this.value.some(val => val == this.getLevel(node, 'value', true))) {
          node.checked = true;
        }

        this.markChildrenChecked(node);
        this.markParentChecked(node);
        this.markParentHasCheckChild(node);

        if (hasArrayChild(node, 'children')) {
          this.recursiveOpt(node.children, node);
        }
      });
    },

    markChildrenChecked(node) {
      const loop = (children, status) => {
        if (children) {
          children.map(child => {
            child.checked = status;

            if (child.checked) {
              child.indeterminate = false;
            }

            if (hasArrayChild(child, 'children')) {
              loop(child.children, status)
            }
          });
        }
      };

      if (node && hasArrayChild(node, 'children')) {
        loop(node.children, node.checked);
      }
    },

    markParentChecked(node) {
      node.indeterminate = false;

      const loop= (node) => {
        let checkCount = 0;

        if (hasArrayChild(node, 'children')) {
          const childIndeterminate = node.children.some(child => child.indeterminate);

          node.children.map(child => {
            if (child.checked) {
              checkCount++;
            }
          })

          if (checkCount === node.children.length) {
            node.checked = true;
            node.indeterminate = false;
          }
          else {
            node.checked = false;

            if (checkCount > 0 || childIndeterminate) {
              node.indeterminate = true;
            }
            else {
              node.indeterminate = false;
            }
          }
        }

        if (node.parent) {
          loop(node.parent);
        }
      }

      if (node?.parent) {
        loop(node.parent);
      }
    },

    markParentHasCheckChild(node) {
      node.hasCheckedChild = false;
    },

    getLevel(node, key, leveled) {
      const levels = [];

      const loop = (data) => {
        levels.push(data[key]);

        if (data.parent) {
          loop(data.parent);
        }
      };

      if (leveled) {
        loop(node);
        return levels.reverse().join('/');
      }
      else {
        return node[key];
      }
    },

    pickCheckedItem(tree) {
      const removeParent = (node) => {
        const obj = {};

        Object.keys(node).forEach(key => {
          if (key !== 'parent') {
            obj[key] = node[key];
          }
        });

        if (hasArrayChild(obj, 'children')) {
          obj.children = obj.children.map(child => removeParent(child));
        }

        return obj;
      };

      this.selectedItems = [];
      this.selectedLabels = [];
      this.selectedValues = [];

      const loop = (data) => {
        if (Array.isArray(data)) {
          data.map(item => {
            if (item.checked) {
              const newItem = removeParent(item);

              this.selectedItems.push(newItem);
              this.selectedLabels.push(this.getLevel(item, 'label', true));
              this.selectedValues.push(this.getLevel(item, 'value', true));
            }

            if (hasArrayChild(item, 'children')) {
              loop(item.children);
            }
          });
        }
      }

      loop(tree);
    },

    removeTag(label) {
      const findNodeByLabel = (label) => {
        let result = null;

        const loop = (tree) => {
          if (tree) {
            tree.find(node => {
              if (this.getLevel(node, 'label', true) === label) {
                result = node;
                return true;
              }

              if (hasArrayChild(node, 'children')) {
                loop(node.children);
              }
            });
          }
        }

        if (label) {
          loop(this.clonedOpts);
          return result;
        }
      }

      const deletedItem = findNodeByLabel(label);

      if (deletedItem) {
        this.checkedChange(deletedItem, false);
      }
    },

    checkedChange(item, checked) {
      item.checked = checked;
      this.markChildrenChecked(item);
      this.markParentChecked(item);
      this.markParentHasCheckChild(item);
      this.pickCheckedItem(this.clonedOpts);
      this.syncData();
    },

    syncData() {
      this.$emit('input', this.selectedValues);
    },

    async spreadNext(children, index, item) {
      if (
        !children && !item.children &&
        this.loadChildrenMethod &&
        this.loadChildrenMethod.constructor === Function &&
        !this.loadChildrenFunc &&
        !item.isLeaf
      ) {
        const isPromiseMethod = this.loadChildrenMethod(item);

        if (isPromise(isPromiseMethod)) {
          this.loadChildrenFunc = isPromiseMethod;
          this.$set(item, 'loading', true);

          const result = await this.loadChildrenFunc.catch(() => {
            this.$set(item, 'loading', false);
          });

          this.$set(item, 'loading', false);
          this.loadChildrenFunc = null;

          if (result && result.constructor === Array) {
            this.recursiveOpt(result, item);
            this.$set(item, 'children', result);
            children = result;
          }
        }
      }

      if (index || index === 0) {
        if (this.cascaderTree.indexOf(children) === -1) {
          if (children?.length > 0) {
            this.cascaderTree.splice(index + 1, this.cascaderTree.length - 1, children);
          }
          else {
            this.cascaderTree.splice(index + 1, this.cascaderTree.length - 1);
          }
        }
      }
    },

    visibleChange(visible) {
      if (visible) {
        this.showPopover = true;
      }
    },

    hidePopover() {
      this.showPopover = false;
    }
  }
};
</script>

<style>
.hide-popper {
  display: none;
}

.cascader-popper {
  padding: 0px;
}

.multi-cascader-demo-wrapper {
  white-space: nowrap;
  overflow-x: auto;
}

.multi-cascader-demo-wrapper .cascader-checkbox {
  margin-right: 10px;
}

.el-cascader-menu__item.has-checked-child {
  background-color: #f5f7fa !important;
}

.dropdown__empty {
  height: 100%;
  padding-top: 50%;
  margin: 0;
  text-align: center;
  color: #999;
  font-size: 14px;
}

.can-load-children {
  position: relative;
}

.can-load-children::after {
  content: "";
  display: inline-block;
  position: absolute;
  width: 5px;
  height: 5px;
  background: #0f0bdb;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
}

.can-load-children.loading-children::after {
  animation: loading 0.22s infinite alternate;
}

@keyframes loading {
  from {
    background: #0f0bdb;
  }

  to {
    background: #d6d6e4;
  }
}
</style>
