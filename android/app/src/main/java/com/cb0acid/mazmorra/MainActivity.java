package com.cb0acid.mazmorra;

import android.app.Activity;
import android.hardware.input.InputManager;
import android.os.Bundle;
import android.view.InputDevice;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.util.Arrays;

/**
 * Carga el juego (assets/index.html) en un WebView y reenvía los mandos de Android
 * al juego como un gamepad virtual (navigator.getGamepads), que el juego ya entiende.
 * Así no dependemos de que el navegador de la tele exponga el mando.
 */
public class MainActivity extends Activity implements InputManager.InputDeviceListener {

    // Gamepad virtual: 4 slots, mapeo "standard" (17 botones, 4 ejes). El juego lee esto cada frame.
    private static final String POLYFILL =
        "(function(){"
        + "if(window.__mzPadBridge)return;"
        + "var pads=[null,null,null,null];"
        + "function mk(s){var b=[];for(var i=0;i<17;i++)b.push({pressed:false,touched:false,value:0});"
        + "return{id:'Android gamepad '+(s+1),index:s,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:b,timestamp:0};}"
        + "navigator.getGamepads=function(){return pads.slice();};"
        + "window.__mzPadBridge={"
        + "connect:function(s){if(!pads[s]){pads[s]=mk(s);window.dispatchEvent(new Event('gamepadconnected'));}},"
        + "disconnect:function(s){if(pads[s]){pads[s]=null;window.dispatchEvent(new Event('gamepaddisconnected'));}},"
        + "button:function(s,i,v){var p=pads[s];if(!p)return;p.buttons[i].value=v;p.buttons[i].pressed=v>0.5;},"
        + "axis:function(s,i,v){var p=pads[s];if(p)p.axes[i]=v;}"
        + "};})();";

    private WebView web;
    private final int[] slotDevice = new int[4];        // deviceId de cada slot, -1 si libre
    private final float[][] keyVal = new float[4][17];  // botones llegados como tecla
    private final float[][] axisVal = new float[4][17]; // botones llegados como eje (gatillos, cruceta)

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);

        Arrays.fill(slotDevice, -1);

        web = new WebView(this);
        setContentView(web);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        web.setBackgroundColor(0xff000000);
        web.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                view.evaluateJavascript(POLYFILL, null);
                scanDevices();
            }
        });

        InputManager im = (InputManager) getSystemService(INPUT_SERVICE);
        im.registerInputDeviceListener(this, null);

        web.loadUrl("file:///android_asset/index.html");
    }

    @Override
    protected void onDestroy() {
        ((InputManager) getSystemService(INPUT_SERVICE)).unregisterInputDeviceListener(this);
        super.onDestroy();
    }

    // ---------- Teclas y botones ----------

    @Override
    public boolean dispatchKeyEvent(KeyEvent e) {
        if (isPadSource(e.getSource())) {
            if (e.getAction() == KeyEvent.ACTION_MULTIPLE) return true;
            int slot = slotFor(e.getDeviceId());
            if (slot < 0) return true;
            int idx = buttonIndex(e.getKeyCode());
            boolean down = e.getAction() == KeyEvent.ACTION_DOWN;
            if (idx < 0) {
                if (down && e.getRepeatCount() == 0) {
                    Toast.makeText(this, "Botón sin mapear: " + KeyEvent.keyCodeToString(e.getKeyCode()), Toast.LENGTH_SHORT).show();
                }
                return true;
            }
            setPad(slot, idx, down ? 1f : 0f, true);
            return true;
        }
        // BACK del mando de la tele = Esc (pausa en el juego), en vez de cerrar la app
        if (e.getKeyCode() == KeyEvent.KEYCODE_BACK && web != null) {
            return web.dispatchKeyEvent(new KeyEvent(e.getAction(), KeyEvent.KEYCODE_ESCAPE));
        }
        return super.dispatchKeyEvent(e);
    }

    // ---------- Sticks y gatillos analógicos ----------

    @Override
    public boolean dispatchGenericMotionEvent(MotionEvent ev) {
        if (isPadSource(ev.getSource()) && ev.getActionMasked() == MotionEvent.ACTION_MOVE) {
            int slot = slotFor(ev.getDeviceId());
            if (slot < 0) return true;
            setAxis(slot, 0, ev.getAxisValue(MotionEvent.AXIS_X));
            setAxis(slot, 1, ev.getAxisValue(MotionEvent.AXIS_Y));
            setAxis(slot, 2, ev.getAxisValue(MotionEvent.AXIS_Z));
            setAxis(slot, 3, ev.getAxisValue(MotionEvent.AXIS_RZ));
            setPad(slot, 6, Math.max(ev.getAxisValue(MotionEvent.AXIS_LTRIGGER), ev.getAxisValue(MotionEvent.AXIS_BRAKE)), false);
            setPad(slot, 7, Math.max(ev.getAxisValue(MotionEvent.AXIS_RTRIGGER), ev.getAxisValue(MotionEvent.AXIS_GAS)), false);
            float hx = ev.getAxisValue(MotionEvent.AXIS_HAT_X);
            float hy = ev.getAxisValue(MotionEvent.AXIS_HAT_Y);
            setPad(slot, 12, hy < -0.5f ? 1f : 0f, false); // arriba
            setPad(slot, 13, hy > 0.5f ? 1f : 0f, false);  // abajo
            setPad(slot, 14, hx < -0.5f ? 1f : 0f, false); // izquierda
            setPad(slot, 15, hx > 0.5f ? 1f : 0f, false);  // derecha
            return true;
        }
        return super.dispatchGenericMotionEvent(ev);
    }

    // ---------- Dispositivos ----------

    @Override
    public void onInputDeviceAdded(int deviceId) {
        if (isPad(InputDevice.getDevice(deviceId))) slotFor(deviceId);
    }

    @Override
    public void onInputDeviceRemoved(int deviceId) {
        for (int i = 0; i < 4; i++) {
            if (slotDevice[i] == deviceId) {
                slotDevice[i] = -1;
                Arrays.fill(keyVal[i], 0f);
                Arrays.fill(axisVal[i], 0f);
                js("window.__mzPadBridge&&window.__mzPadBridge.disconnect(" + i + ")");
            }
        }
    }

    @Override
    public void onInputDeviceChanged(int deviceId) {
        // sin acción
    }

    private void scanDevices() {
        for (int id : InputDevice.getDeviceIds()) {
            if (isPad(InputDevice.getDevice(id))) slotFor(id);
        }
    }

    private int slotFor(int deviceId) {
        for (int i = 0; i < 4; i++) if (slotDevice[i] == deviceId) return i;
        for (int i = 0; i < 4; i++) {
            if (slotDevice[i] == -1) {
                slotDevice[i] = deviceId;
                js("window.__mzPadBridge&&window.__mzPadBridge.connect(" + i + ")");
                return i;
            }
        }
        return -1; // ya hay 4 mandos
    }

    private static boolean isPad(InputDevice d) {
        return d != null && isPadSource(d.getSources());
    }

    private static boolean isPadSource(int src) {
        return (src & InputDevice.SOURCE_GAMEPAD) == InputDevice.SOURCE_GAMEPAD
            || (src & InputDevice.SOURCE_JOYSTICK) == InputDevice.SOURCE_JOYSTICK;
    }

    // ---------- Envío al juego ----------

    private void setPad(int slot, int idx, float v, boolean fromKey) {
        if (fromKey) keyVal[slot][idx] = v; else axisVal[slot][idx] = v;
        float out = Math.max(keyVal[slot][idx], axisVal[slot][idx]);
        js("window.__mzPadBridge&&window.__mzPadBridge.button(" + slot + "," + idx + "," + out + ")");
    }

    private void setAxis(int slot, int idx, float v) {
        js("window.__mzPadBridge&&window.__mzPadBridge.axis(" + slot + "," + idx + "," + v + ")");
    }

    private void js(String code) {
        if (web != null) web.evaluateJavascript(code, null);
    }

    // Botón de Android -> índice del mapeo "standard" de Gamepad
    private static int buttonIndex(int keyCode) {
        switch (keyCode) {
            case KeyEvent.KEYCODE_BUTTON_A: return 0;
            case KeyEvent.KEYCODE_BUTTON_B: return 1;
            case KeyEvent.KEYCODE_BUTTON_X: return 2;
            case KeyEvent.KEYCODE_BUTTON_Y: return 3;
            case KeyEvent.KEYCODE_BUTTON_L1: return 4;
            case KeyEvent.KEYCODE_BUTTON_R1: return 5;
            case KeyEvent.KEYCODE_BUTTON_L2: return 6;
            case KeyEvent.KEYCODE_BUTTON_R2: return 7;
            case KeyEvent.KEYCODE_BUTTON_SELECT: return 8;
            case KeyEvent.KEYCODE_BUTTON_START: return 9;
            case KeyEvent.KEYCODE_BUTTON_THUMBL: return 10;
            case KeyEvent.KEYCODE_BUTTON_THUMBR: return 11;
            case KeyEvent.KEYCODE_DPAD_UP: return 12;
            case KeyEvent.KEYCODE_DPAD_DOWN: return 13;
            case KeyEvent.KEYCODE_DPAD_LEFT: return 14;
            case KeyEvent.KEYCODE_DPAD_RIGHT: return 15;
            case KeyEvent.KEYCODE_BUTTON_MODE: return 16;
            default: return -1;
        }
    }
}
