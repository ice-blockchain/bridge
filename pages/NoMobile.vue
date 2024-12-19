<!-- NoMobile.vue -->
<template>
    <div class="no-mobile">
        <div class="menu">
            <img
                src="~assets/pics/ice-open-network-logo.svg"
                alt="Ice Open Network"
            />
        </div>
        <div class="content">
            <div class="notification">
                <img
                    src="~assets/pics/no-mobile.svg"
                    alt="Only desktop version supported"
                />
                <div class="text">
                    <h1>The ICE Bridge is available only on desktop devices</h1>
                    <span
                        >To access, please visit this page on your desktop
                        browser.</span
                    >
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'NoMobile',
}
</script>

<style lang="less" scoped>
.no-mobile .menu {
    box-sizing: border-box;

    position: absolute;
    width: 343px;
    height: 60px;
    left: calc(50% - 343px / 2);
    top: 60px;

    background: #ffffff;
    box-shadow: 0 0 21px rgba(0, 0, 0, 0.1);
    border-radius: 20px;
}

.no-mobile .menu img {
    position: absolute;
    width: 141px;
    height: 30px;
    left: calc(50% - 141px / 2);
    top: calc(50% - 30px / 2);
}

.no-mobile .content {
    box-sizing: border-box;

    position: absolute;
    width: 343px;
    height: 626px;
    left: calc(50% - 343px / 2);
    top: 136px;

    background: #ffffff;
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.05);
    border-radius: 20px;
}

.no-mobile .content .notification {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0;
    gap: 20px;

    position: absolute;
    width: 320px;
    height: 194px;
    left: calc(50% - 320px / 2 - 1px);
    top: calc(50% - 194px / 2);
}

.no-mobile .content .notification img {
    width: 80px;
    height: 80px;

    flex: none;
    order: 0;
    flex-grow: 0;
}

.no-mobile .content .notification .text {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 0;
    gap: 12px;
    width: 320px;
}

.no-mobile .content .notification .text h1 {
    width: 320px;
    top: 0;
    font-family: 'Noto Sans', serif;
    font-style: normal;
    font-weight: 600;
    font-size: 17px;
    line-height: 23px;
    text-align: center;
    color: #0e0e0e;
}

.no-mobile .content .notification .text span {
    width: 320px;
    font-family: 'Noto Sans', serif;
    font-style: normal;
    font-weight: 400;
    font-size: 13px;
    line-height: 18px;
    text-align: center;
    color: #494949;
}
</style>
