@vite(['resources/css/experiment-exbox.scss', 'resources/js/experiment/testing-exbox.tsx'])
<div style="height: 450px;"></div>
<div style="display: flex;">
    <div style="width: 250px;">
        <select class="exBoxTest1">
            <option value="">...</option>
            <option value="1">Jhony Mohade</option>
            <option value="2" selected>Darius</option>
            <option value="3">Tom Holland xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</option>
            <option value="4">Jimmy</option>
            <option value="5">Tony Setiadi</option>
            <option value="6">Hendro</option>
        </select>
    </div>
    <div style="width: 250px;">
        <select class="exBoxTest2">
            <option value="">...</option>
            <option value="1" data-additional="xxx" selected>Jhony Mohade</option>
            <option value="2">Darius</option>
        </select>
    </div>
</div>
<div style="height: 450px;"></div>
